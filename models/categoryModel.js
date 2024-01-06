const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
     name:{
        type : String,
        required:true,
        unique : true
     },
     discription:{
      type : String,
      required:true
     },
     
     color:{
        type : String,
     },
     image:{
        type : String,
        required:true
     },
     
     stock:{
        type : Number,
        default:0
     },
     sold:{
      type : Number,
      default:0

     } ,
     addedDate: {
       type: Date, 
       default: Date.now
       
    },
})


module.exports = mongoose.model("Category", categorySchema)