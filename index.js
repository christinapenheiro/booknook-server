import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import multer from "multer";
import path from "path";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

async function startServer() {
  try {
    await connectToMongoDB();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

const dataBase = client.db("booknook");
const booksCollection = dataBase.collection("books");
const borrowsCollection = dataBase.collection("borrows");

startServer();

const verifyApi = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized! No auth header." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized! No token found." });
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; // Attach user payload if needed
    next();
  } catch (error) {
    console.error("JWKS Verification Error:", error.message); // 👈 Check your console for this log!
    return res
      .status(500)
      .send({
        msg: "Server error during token verification!",
        details: error.message,
      });
  }
};

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });

// All books API: returns all books with live copies_left count - public

app.get("/",async(req,res)=>{
  res.send("Server is running fine.")
})




app.get("/books", async (req, res) => {
  try {
    const books = await booksCollection.find().sort({ date: -1 }).toArray();
    res.send(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send({ error: "Failed to fetch books" });
  }
});


// Add new book API: saves book with added_by and email - private
app.post("/books",verifyApi, async (req, res) => {
  try {
    const book = req.body
    // const book = req.body;
    const result = await booksCollection.insertOne(book);
    res.send({ ...result, insertedId: result.insertedId, book });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).send({ error: "Failed to create book" });
  }
});


// Single book detail API - private
app.get("/books/:id", verifyApi, async (req, res) => {
  try {
    const { id } = req.params;
    let result = null;
    if (ObjectId.isValid(id)) {
      result = await booksCollection.findOne({ _id: new ObjectId(id) });
    }
    if (!result) {
      result = await booksCollection.findOne({ _id: id });
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).send({ error: "Failed to fetch book" });
  }
});

// Update book API - private
app.put("/books/:id",verifyApi, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (req.body.book_image !== undefined) {
      updateData.book_image = req.body.book_image;
    }
    if (updateData._id) {
      delete updateData._id;
    }
    if (updateData.copies_left !== undefined) {
      updateData.copies_left = Number(updateData.copies_left);
    }
    if (updateData.rating !== undefined) {
      updateData.rating = Number(updateData.rating);
    }
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    await booksCollection.updateOne(filter, { $set: updateData });
    const updatedBook = await booksCollection.findOne(filter);
    res.send(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).send({ error: "Failed to update book" });
  }
});

// Delete book API - private
app.delete("/books/:id",verifyApi, async (req, res) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const result = await booksCollection.deleteOne(filter);
    res.send(result);
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).send({ error: "Failed to delete book" });
  }
});






app.get("/featured",async(req,res)=>{
  const result = await booksCollection.find().limit(6).toArray()
  res.send(result)
})


// My-books API: returns books added by the logged-in user with live copies_left count - private
app.get("/my-books",verifyApi, async (req, res) => {
  try {
    const { email, added_by } = req.query;
    if (!email && !added_by) {
      return res.send([]);
    }

    const conditions = [];
    if (email && typeof email === "string" && email.trim()) {
      conditions.push({
        email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
      });
    }
    if (added_by && typeof added_by === "string" && added_by.trim()) {
      conditions.push({
        added_by: { $regex: new RegExp(`^${added_by.trim()}$`, "i") },
      });
    }

    if (conditions.length === 0) {
      return res.send([]);
    }

    const books = await booksCollection.find({ $or: conditions }).toArray();
    res.send(books);
  } catch (error) {
    console.error("Error fetching my-books:", error);
    res.status(500).send({ error: "Failed to fetch my-books" });
  }
});



// My-books API with email param - private
app.get("/my-books/:email",verifyApi, async (req, res) => {
  try {
    const { email } = req.params;
    if (!email || !email.trim()) {
      return res.send([]);
    }
    const books = await booksCollection
      .find({
        email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
      })
      .toArray();
    res.send(books);
  } catch (error) {
    console.error("Error fetching my-books by email parameter:", error);
    res.status(500).send({ error: "Failed to fetch my-books" });
  }
});





// Get user's active borrows - private
app.get("/my-borrows",verifyApi, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.send([]);
    }
    const userBorrows = await borrowsCollection
      .find({
        user_email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
        returned: false,
      })
      .sort({ createdAt: -1 })
      .toArray();
    res.send(userBorrows);
  } catch (error) {
    console.error("Error fetching my-borrows:", error);
    res.status(500).send({ error: "Failed to fetch borrowed books" });
  }
});



// Check if user has already borrowed this specific book without returning it - private
app.get("/my-borrows/check/:id",verifyApi, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.send({ alreadyBorrowed: false });
    }
    const existing = await borrowsCollection.findOne({
      book_id: id,
      user_email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
      returned: false,
    });
    res.send({ alreadyBorrowed: !!existing });
  } catch (error) {
    console.error("Error checking borrow status:", error);
    res.status(500).send({ error: "Failed to check borrow status" });
  }
});


// Return a borrowed book: POST /my-borrows/return/:id - private
// Marks loan as returned and restores (+1) copies_left in booksCollection
app.post("/my-borrows/return/:id",verifyApi, async (req, res) => {
  try {
    const { id } = req.params;

    let borrowRecord = null;
    if (ObjectId.isValid(id)) {
      borrowRecord = await borrowsCollection.findOne({ _id: new ObjectId(id) });
    }
    if (!borrowRecord) {
      borrowRecord = await borrowsCollection.findOne({
        book_id: id,
        returned: false,
      });
    }

    if (!borrowRecord) {
      return res.status(404).send({ error: "Borrow record not found." });
    }

    // Mark as returned
    await borrowsCollection.updateOne(
      { _id: borrowRecord._id },
      { $set: { returned: true, returned_date: new Date() } },
    );

    // Increment copies_left in booksCollection
    const bookId = borrowRecord.book_id;
    const updateQuery = ObjectId.isValid(bookId)
      ? { _id: new ObjectId(bookId) }
      : { _id: bookId };

    const targetBook = await booksCollection.findOne(updateQuery);
    let updatedCopies = 1;
    if (targetBook) {
      updatedCopies = (Number(targetBook.copies_left) || 0) + 1;
      await booksCollection.updateOne(updateQuery, {
        $set: { copies_left: updatedCopies },
      });
    }

    res.send({
      success: true,
      message: `"${borrowRecord.book_title}" returned successfully.`,
      copies_left: updatedCopies,
    });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).send({ error: "Failed to return book." });
  }
});




// Borrow a book by ID: POST /my-borrows/:id - private
// Enforces 1-book-per-user restriction and decrements copies_left in booksCollection
app.post("/my-borrows/:id",verifyApi, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, user_name, return_days } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(401).send({ error: "Please sign in to borrow books." });
    }

    const trimmedEmail = email.trim();

    // 1. Check if user has already borrowed this book once and hasn't returned it yet
    const existing = await borrowsCollection.findOne({
      book_id: id,
      user_email: { $regex: new RegExp(`^${trimmedEmail}$`, "i") },
      returned: false,
    });

    if (existing) {
      return res.status(400).send({
        error:
          "You have already borrowed this book. You cannot take the same book twice before returning it.",
        alreadyBorrowed: true,
      });
    }

    // 2. Check if book exists and has available copies
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const book = await booksCollection.findOne(filter);

    if (!book) {
      return res.status(404).send({ error: "Book not found." });
    }

    const currentCopies = Number(book.copies_left);
    if (isNaN(currentCopies) || currentCopies <= 0) {
      return res.status(400).send({
        error:
          "Sorry, this book is currently unavailable (no copies left in library).",
      });
    }

    // 3. Decrement copies_left safely in booksCollection
    const newCopies = Math.max(0, currentCopies - 1);
    await booksCollection.updateOne(filter, {
      $set: { copies_left: newCopies },
    });

    // 4. Save borrow record into borrowsCollection
    const duration = Number(return_days) || 7;
    const borrowedDate = new Date();
    const dueDate = new Date(
      borrowedDate.getTime() + duration * 24 * 60 * 60 * 1000,
    );

    const borrowRecord = {
      book_id: String(book._id || id),
      book_title: book.book_title,
      author_name: book.author_name,
      book_image: book.book_image,
      category: book.category,
      user_email: trimmedEmail.toLowerCase(),
      user_name: user_name || "Reader",
      borrowed_date: borrowedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      due_date: dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      days_left: duration,
      return_days: duration,
      returned: false,
      createdAt: borrowedDate,
    };

    const insertResult = await borrowsCollection.insertOne(borrowRecord);

    res.send({
      success: true,
      message: `You have successfully borrowed "${book.book_title}".`,
      borrowId: insertResult.insertedId,
      copies_left: newCopies,
    });
  } catch (error) {
    console.error("Error borrowing book:", error);
    res.status(500).send({ error: "Failed to process borrow request." });
  }
  console.log();
});




export default app;
