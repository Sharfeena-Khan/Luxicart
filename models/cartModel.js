const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const wishListSchema = new mongoose.Schema({
           user_id :{
           type: ObjectId,
           ref : 'User'
           },
           products : [{
            product_id: {
                type : ObjectId,
                ref : "Product"
                
            },
            category : {
                type : String
            },
            name :{
                type : String
            },
           price :{
                type : Number
            },image :{
                type : String
            },
           }]
})

const cartSchema = new mongoose.Schema({
   
    user_id :{
        type: ObjectId,
        
    },
    total: {
        type: Number,
         // Set a default value if needed
    },
    products : [
        {
            product_id : {
                type: ObjectId,
                required: true
            },
            name:{
                type : String,
            },
            price :{
                type:Number
            },
            image: {
                type : String
            },
            size:{
                type : String
            },
            quantity : {
                type : Number,
                default : 1
            },
            stock : {
                type : Number
            }
            
        }
    ],
    

})
const WishList = mongoose.model("Wishlist" , wishListSchema)
const Cart = mongoose.model("Cart", cartSchema)

module.exports = {
    WishList , Cart
}