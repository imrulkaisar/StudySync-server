const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 3333;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://studysync.surge.sh", "http://localhost:5173"],
    credentials: true,
  })
);

// app.use(cors());
app.use(cookieParser());

// Default API
app.get("/", (req, res) => {
  res.send("App is running...");
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!req.query.email) {
    next();
    req.user = {};
    return;
  }

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    req.user = decoded;

    next();
  });
};

// access token key
app.post("/api/v1/jwt", async (req, res) => {
  const body = req.body;
  const secret = process.env.TOKEN_SECRET;
  const token = jwt.sign(body, secret, { expiresIn: "1h" });

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ message: "success" });
});

// Clear the token on user logout
app.get("/api/v1/logout", (req, res) => {
  res.clearCookie("token").send({ message: "Logged out successfully" });
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
    // await client.connect();
    // console.log("Connected to the database");

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
    app.get("/api/v1/assignments", verifyToken, async (req, res) => {
      try {
        let query = {};
        const reqUser = req.user?.email || null;

        if (
          req.query.email === reqUser &&
          req.query.difficultyLabel === "null"
        ) {
          const queryEmail = req.query.email;
          query = { "author.email": queryEmail };
        }
        if (
          req.query.difficultyLabel !== "null" &&
          !req.query.email &&
          req.query.difficultyLabel
        ) {
          const queryLevel = req.query.difficultyLabel;
          query = {
            difficultyLabel: queryLevel,
          };
        }
        if (
          req.query.email === reqUser &&
          req.query.difficultyLabel !== "null"
        ) {
          const queryEmail = req.query.email;
          const queryLevel = req.query.difficultyLabel;
          query = {
            difficultyLabel: queryLevel,
            "author.email": queryEmail,
          };
        }

        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;

        const result = await assignmentsData
          .find(query)
          .skip(size * page)
          .limit(size)
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get assignment total count
    app.get("/api/v1/assignments/count", async (req, res) => {
      try {
        const count = await assignmentsData.countDocuments();
        res.status(200).json({ count }); // Return the count as part of a JSON object
      } catch (error) {
        console.error("Error fetching total assignments:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Handle errors gracefully
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
    app.get("/api/v1/submitted-assignments", verifyToken, async (req, res) => {
      try {
        let query = {};

        const reqUser = req.user?.email || null;

        // if (!req.user) {
        //   return res
        //     .status(403)
        //     .send({ message: "forbidden access", user: req.user });
        // }

        if (req.query.email === reqUser && req.query.status === "null") {
          const queryEmail = req.query.email;
          query = { "examinee.email": queryEmail };
        }
        if (req.query.status !== "null" && !req.query.email) {
          const queryStatus = req.query.status;
          query = {
            status: queryStatus,
          };
        }
        if (req.query.email === reqUser && req.query.status !== "null") {
          const queryEmail = req.query.email;
          const queryStatus = req.query.status;
          query = {
            status: queryStatus,
            "examinee.email": queryEmail,
          };
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
