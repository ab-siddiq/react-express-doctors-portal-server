const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const { query } = require("express");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.k6rvd.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://doctorsportal:ZorSm9eIVbFM0NDB@cluster0.k6rvd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("doctorsportal").collection("users");
    console.log("connected 1");
    //get or fetch user
    app.get("/user", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });
    //post or insert user
    app.post("/user", async (req, res) => {
      const user = req.body;
      doc = {
        user: "siddiq",
        password: "123456",
      };
      const result = await userCollection.insertOne(doc);
      res.send(result);
    });
    //post or insert appointment
    app.post("/appointment", async (req, res) => {
      const appointment = req.body;
      const result = await userCollection.insertOne(appointment);
      res.send(result);
    });
    //fetch or get appointment
    app.get("/appointments", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const appointments = await cursor.toArray();
      res.send(appointments);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server");
});

app.listen(port, () => {
  console.log("listening port=>", port);
});
