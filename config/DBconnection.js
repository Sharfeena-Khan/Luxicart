const mongoose = require("mongoose")
const mongodb = require("mongodb")
const dotenv = require("dotenv")

dotenv.config()
const db = mongoose.connect(process.env.MONGO_URL)
     .then(()=>console.log("Db Connection Successfull"))
    .catch((err)=>console.log(err))



module.exports = db