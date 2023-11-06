const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 3333;

// middleware
app.use(express.json());
// app.use(
//   cors({
//     origin: ["http://localhost:5173/"],
//     credentials: true,
//   })
// );

app.use(cors());

// Default API
app.get("/", (req, res) => {
  res.send("App is running...");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.itr0uhy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to the database");

    const database = client.db("studySync");
    const assignmentsData = database.collection("assignmentsData");

    /** Database APIs */

    /**
     * ===========================
     * Assignment APIs
     * ===========================
     */

    // Get all assignments
    app.get("/api/v1/assignments", async (req, res) => {
      try {
        const result = await assignmentsData.find().toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Get single assignment
    app.get("/api/v1/assignments/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await assignmentsData
          .find({ _id: new ObjectId(id) })
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // create assignment
    app.post("/api/v1/create-assignment", async (req, res) => {
      try {
        const body = req.body;
        const result = await assignmentsData.insertOne(body);

        res.json(result);
      } catch (error) {
        console.log(error);
      }
    });

    // update assignment

    // delete assignment

    /**
     * =============================
     * submitted assignments APIs
     * =============================
     */

    // add submitted assignment

    // update submitted assignment

    // end try block
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
