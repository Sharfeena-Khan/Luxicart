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
     
    
     image:{
        type : String,
        required:true
     },
     active: {     // List & Unlist
      type: Boolean,
      default: true
     },
     isDelete :{   // soft Delete
      type : Boolean , 
      required : true,
      default :false
  }
    ,
    
     addedDate: {
       type: Date, 
       default: Date.now
       
    },
})


module.exports = mongoose.model("Category", categorySchema)