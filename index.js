const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
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
//middle tear
const verifyJWT = (req,res,next)=>{
console.log('jwt');
const authHeader = req.headers.authorization;
if (!authHeader) {
  return res.status(401).send({ message: "Unauthotized access!" });
}
const token = authHeader.split(' ')[1];
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function(err,decoded){
  if(err){
    return res.status(403).send({message: 'Forbidden access!'})
  }
  req.decoded = decoded;
  console.log(req.decoded.email,'decod')
  next();
})
}
async function run() {
  try {
    await client.connect();
    const userCollection = client.db("doctorsportal").collection("users");
    const serviceCollection = client.db("doctorsportal").collection("services");
    const appointmentCollection = client.db("doctorsportal").collection("appointments");
    console.log("connected 1");

    //get or fetch user
    app.get("/user", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    //update or insert user
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const options = {upsert: true};
      const filter = {email:email};
      updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter,updateDoc,options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      console.log(token)
      res.send({result,token});
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
      // console.log(date)
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
    //   console.log(patient)
    //   const query = {patient:patient};
    //   const appointments = await appointmentCollection.find(query).toArray();
    //   res.send(appointments)
    // })
    app.get("/appointment", verifyJWT,async (req,res)=>{
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      console.log('d',decodedEmail);
      // const authorization = req.headers.authorization;
      // console.log(authorization)
      // console.log(patient);
      // console.log('patient',req.query.patient);
      if(decodedEmail===patient){
      const query = { patient: patient };
      const appointments = await appointmentCollection.find(query).toArray();
      res.send(appointments)
      }else{
        res.status(403).send({message: 'Acces denied!'})
      }
    })

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
      // console.log("query", query);
      const exists = await appointmentCollection.findOne(query);
      // console.log(exists);
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
