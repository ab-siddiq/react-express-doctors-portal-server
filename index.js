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
    const serviceCollection = client.db("doctorsportal").collection("services");
    const appointmentCollection = client
      .db("doctorsportal")
      .collection("appointments");
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

    //fetch or get services
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //available services & appointments
    app.get("/available", async (req, res) => {
      const date = req.query.date;
      //1 get all services
      const services = await serviceCollection.find().toArray();
      // 2 get appointment on particular date
      const query = { date: date };
      // console.log(query)
      const appointments = await appointmentCollection.find(query).toArray();
      // console.log(appointments)
      // for each sercvices, find appointments for service
      services.forEach((service) => {
        const serviceAppointments = appointments.filter(
          (appointment) => appointment.appointmentFor === service.name
        );
        // console.log(serviceAppointments);
        const appointed = serviceAppointments.map((serviceAppointment) =>
          serviceAppointment.slot
        );

        const available = service.slots.filter(slot=> !appointed.includes(slot));
        service.slots = available;
      });
      res.send(services);
    });
    // //get appointment
    // app.get("/appointment",async(req,res)=>{
    //   const patient = req.query.patient;
    //   const query = {patient:patient};
    //   const appointments = await appointmentCollection.find(query).toArray();
    //   res.send(appointments)
    // })

    //post or insert appointment
    // check/prevent mulitple appointment
    app.post("/appointment", async (req, res) => {
      const appointment = req.body;
      // console.log("op", appointment);
      const query = {
        appointmentFor: appointment.appointmentFor,
        date: appointment.date,
        patient: appointment.patient,
      };
      console.log("query", query);
      const exists = await appointmentCollection.findOne(query);
      console.log(exists);
      if (exists) {
        return res.send({ success: false, appointment: exists });
      }

      const result = await appointmentCollection.insertOne(appointment);
      res.send({ success: true, result });
    });

    //fetch or get appointment
    app.get("/appointments", async (req, res) => {
      const patient = req.body;
      console.log(patient);
      const query = {};
      const cursor = appointmentCollection.find(query);
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
