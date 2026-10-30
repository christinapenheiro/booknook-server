import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config";

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());


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

connectToMongoDB();

const dataBase = client.db("booknook")
const booksCollection = dataBase.collection("books")


app.get("/books",async(req,res)=>{
    const books = await booksCollection.find().toArray()
    res.send(books)
})



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
