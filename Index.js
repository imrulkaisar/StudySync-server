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
    const submittedAssignments = database.collection("submittedAssignments");

    /** Database APIs */

    /**
     * ===========================
     * Assignment APIs
     * ===========================
     */

    // Get all assignments
    app.get("/api/v1/assignments", async (req, res) => {
      try {
        let query = {};

        if (req.query.email && req.query.difficultyLabel === "null") {
          const queryEmail = req.query.email;
          query = { "author.email": queryEmail };
        }
        if (req.query.difficultyLabel !== "null" && !req.query.email) {
          const queryLevel = req.query.difficultyLabel;
          query = {
            difficultyLabel: queryLevel,
          };
        }
        if (req.query.email && req.query.difficultyLabel !== "null") {
          const queryEmail = req.query.email;
          const queryLevel = req.query.difficultyLabel;
          query = {
            difficultyLabel: queryLevel,
            "author.email": queryEmail,
          };
        }

        const result = await assignmentsData.find(query).toArray();

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
    app.patch("/api/v1/update-assignment/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const body = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: body.newTitle,
            description: body.newDescription,
            marks: body.newMarks,
            thumbnail: body.newThumbnail,
            difficultyLabel: body.newDifficultyLabel,
            dueDate: body.newDueDate,
          },
        };
        const options = { upsert: true };

        const result = await assignmentsData.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    // delete assignment

    app.delete("/api/v1/delete-assignment/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await assignmentsData.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    /**
     * =============================
     * submitted assignments APIs
     * =============================
     */

    // get all submitted assignments
    app.get("/api/v1/submitted-assignments", async (req, res) => {
      try {
        let query = {};
        if (req.query.status) {
          reqSatus = req.query.status;
          query = { status: reqSatus };
        }
        const result = await submittedAssignments.find(query).toArray();
        res.send(result);
      } catch (error) {}
    });

    // add submitted assignment
    app.post("/api/v1/submit-assignment", async (req, res) => {
      try {
        const body = req.body;
        const result = await submittedAssignments.insertOne(body);
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    // update submitted assignment
    app.patch("/api/v1/submitted-assignments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const body = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            givenMarks: body.givenMark,
            feedback: body.feedback,
            status: body.status,
            "examiner.name": body.examiner.name,
            "examiner.email": body.examiner.email,
          },
        };
        const options = { upsert: true };
        const result = await submittedAssignments.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    // end try block
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
