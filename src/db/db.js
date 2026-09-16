const mongoose = require("mongoose");

async function connectDB() {

    await mongoose.connect("mongodb+srv://new_user:ujMX6siRVdu8PbDc@complete-backend.du9jmrw.mongodb.net/project-1")

    console.log("Connected to DB");
    
}

module.exports = connectDB;
