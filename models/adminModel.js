const mongoose = require("mongoose")


const adminSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true

    },
    isAdmin:{
        type:Boolean,
        default:true
    },
    subAdmin:{
        type:Boolean,
        default:false
    },
   
   
} ,
    {  timestamps: true}
)
module.exports = mongoose.model("Admin", adminSchema)