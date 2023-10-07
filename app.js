const express = require('express');
const cors = require("cors")
const app = express();
const dotenv = require('dotenv')
dotenv.config({path: './config.env' })
const passport = require("passport");
const passportStrategy = require("./passport");

// Google Auth - passport
app.use(passport.initialize());

//cors gateway to client
app.use(
    cors({
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
);

//Connect to the DB
require('./db/dbconn');

//Router 
app.use(express.json());
const authRoute = require("./router/auth");
app.use("/", authRoute);


app.use(express.static("client/dist"));
app.get("/",function(req,res) {
    res.sendFile(path.join(__dirname, "./client/dist/index.html"));
})
                                 
//PORT
const PORT = 4000;
app.listen(PORT,()=>console.log(`Server Running on Port ${PORT}`)); 
console.log("========================"); 