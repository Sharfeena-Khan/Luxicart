const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    code: { type: String, require: true, unique: true },
    Description : { type : String , },
    isPercent: { type: Boolean,  },
    amount: { type: Number,  }, // if is percent, then number must be ≤ 100, else it’s amount of discount
    expireDate: { type: String, require: true,  },
    isActive: { type: Boolean, require: true, default: true }});


module.exports = mongoose.model("Coupon", couponSchema)