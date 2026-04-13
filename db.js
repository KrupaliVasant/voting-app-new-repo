const mongoose = require('mongoose');

//define the MongoDB connection URL
//const mongoURL_LOCAL = process.env.MONGODB_URL_LOCAL; //'hotels' is mydatabasename
//const mongoURL = process.env.MONGODB_URL;   //mongodb atlas
const mongoURL = process.env.MONGODB_URL; //'hotels' is mydatabasename

//set up MongoDB connection 
mongoose.connect(mongoURL)
    .then(() => console.log("successfully"))
    .catch(() => console.log("error"));

// get the default connection
// mongoose maintains a default connection object representing the MongoDB connection
const db = mongoose.connection;

// define event listeners for database connection
db.on('connected', () => {
    console.log("Connected to MongoDB server....")
});

db.on('error', () => {
    console.log("MongoDB connection error.")
});

db.on('disconnected', () => {
    console.log("MongoDB disconnected.")
});

// Export the database connection
module.exports = db;