import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config";
import multer from "multer";

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use("/uploads",express.static("uploads"));


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

  } catch (error){
    console.error("Failed to start server:",error)
  }
}

startServer()

 const dataBase = client.db("booknook");
 const booksCollection = dataBase.collection("books");

const storage = multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null,"uploads/");
  },
  filename: (req,file,cb) => {
    cb(null,Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage })

app.get("/books",async(req,res)=>{
    const books = await booksCollection.find().toArray()
    res.send(books)
})

app.post("/books",upload.single("book_image"),async(req,res)=>{
  const books = {...req.body,book_image:`/uploads/${req.file.filename}`,}
  console.log(books)
  const result = await booksCollection.insertOne(books)
  res.send(result)
})



