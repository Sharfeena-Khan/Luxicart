const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    minAmount :{ type : Number, required: true},
    Discount  : { type : Number , required: true },
    Start : { type: Date },
     // if is percent, then number must be ≤ 100, else it’s amount of discount
    expireDate: { type: Date },
    Status : { type : String, default : "Active"},
    Created : { type :Date , default : new Date() },
    isActive: { type: Boolean, require: true, default: true }},
    {  timestamps: true});


module.exports = mongoose.model("Coupon", couponSchema)