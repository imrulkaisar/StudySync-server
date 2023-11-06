const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 3333;

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
    const assignments = database.collection("assignments");

    /** Database APIs */

    /**
     * ===========================
     * Assignment APIs
     * ===========================
     */

    // Get all assignments

    // create assignment

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
