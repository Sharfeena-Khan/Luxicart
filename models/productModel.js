const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,

    },
    description: {
        type:String,
        required:true,

    }, price:{
        type: Number,
        required:true,
        default: 0

    },
     
    image: {
        type:String,
        required:true
    },
    images: [{
        type:String,
        
    }],
    stock:{
        type: Number,
        required:true,
        min : 0,
        max : 255

    },
    category: {
        type: String, // Change the type to String to store the category name
        required: true,
      },

    
    discountType:{
        type:String
    },
    discountPercentage:{
        type:String
    },
    status : {
        type: String
    },
    sku : {
        type : Number
    }
        

})

module.exports = mongoose.model("Product", productSchema)