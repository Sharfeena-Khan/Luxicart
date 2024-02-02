const mongoose = require("mongoose")
const { ObjectId } = require("mongodb")
const Cart = require('./cartModel');
const { date } = require("joi");
const Schema = mongoose.Schema;


const PaymentSchema = new Schema({
  user_id :{
     type: ObjectId,
     ref : 'User'
 },
 orders : [{
   order_id : {
     type : ObjectId,
     ref : 'Order'
   },
  
    payment_id: {
      type : ObjectId
    },
    order_id: {
      type : ObjectId
    },
    signature:{
      type : ObjectId
    } ,
     Total_Amount : {
      type : Number
     },
   Date: {
      type: Date,
    },
   
   
  
 }]
});

const OrdersSchema = new Schema({
   user_id :{
      type: ObjectId,
      ref : 'User'
  },
  address : {

    _id: {type : ObjectId },
   
   
    name :{
        type : String
    },
    adrs : {
        type :String,
        
    },
    pincode :{
        type: Number,
        
    },
    
        
 
    city : {
        type : String,
       
  
    },
    state : {
        type : String,
        
    },
     landmark : {
    type : String,
    
  },
  phoneNum : {
    type : Number,
   
  },
  },
  items : [
    {
      productId: { type: Schema.Types.ObjectId,ref: 'Cart' },
      productName: { type: String },
      price: { type: Number },
      category: { type: String },
      img1: { type: String },
      size: { type: String },
      quantity: { type: Number },
      orderPlaced : {type : Date,  },
      orderStatus: { type: String },
      deliveryDate : { type : Date,
        default: function () {
          // Calculate default delivery date as 3 days after orderPlaced
          const defaultDeliveryDate = new Date()
          defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 3);
          return defaultDeliveryDate;
        },required : true
      },
   
      paymentMode: { type: String,},
     
    },
  ],
  
  orderDate: {
    type: Date,
     default: Date.now
    
  },
 
 },
 { timestamps: true }
 );

 
const Payment = mongoose.model('Payment', PaymentSchema)
const Order = mongoose.model('Order', OrdersSchema);

module.exports = {
  Payment, Order
}