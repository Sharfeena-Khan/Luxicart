const mongoose = require("mongoose")

const bannerSchema = new mongoose.Schema({
   image : {
    type : String,
        
   }
    
    },
    {  timestamps: true});


module.exports = mongoose.model("Banner", bannerSchema)