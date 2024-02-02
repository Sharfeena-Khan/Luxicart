
const Coupon = require("../models/coupon")

const couponPage = async(req, res)=>{
    try {
        console.log("Coupon Page");
  
      const couponData = await Coupon.find()
      res.render("couponList" , {title:`Luxicart-Coupons` ,couponData })
      
    } catch (error) {
      console.log(error);
    }
  }

  const genrateCoupon =async(req, res)=>{
    try {
        console.log("----------------------       Generating Coupon  ---------------------");
        const { Cname,minAmount, percentage, expDate, StartingDate} = req.body
        console.log(req.body);
        const couponData = await Coupon.find({code: Cname})
        if(couponData.length>0){
          res.render("couponList" , {title:`Luxicart-Coupons` ,couponData })
     
        }else{
          const newCoupon = new Coupon({
            code : Cname,
            minAmount : minAmount,
            Discount : percentage,
            Start : StartingDate,
            expireDate : expDate,
            Status : "Available",
            
            isActive : true


          })
          await newCoupon.save()
          res.render("couponList" , {title:`Luxicart-Coupons` ,couponData })
     
        }
        
    } catch (error) {
        console.log(error);
    }
  }


  module.exports = {
  couponPage,
  genrateCoupon

  }