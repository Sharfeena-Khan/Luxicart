
const Coupon = require("../models/coupon")

const couponPage = async (req, res) => {
  try {
    console.log("Coupon Page");

    const couponData = await Coupon.find();

    if (couponData) {
      let currentDay = new Date();

      for (let coupon of couponData) {
        let EXPR = coupon.expireDate;
        let status;

        if (EXPR < currentDay) {
          status = "Expired";
        } else {
          status = "Active";
        }

        coupon.Status = status;
        await coupon.save();
      }

      res.render("couponList", { title: "Luxicart-Coupons", couponData });
    }
  } catch (error) {
    console.log(error);
  }
};


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
            Status : "Active",
            
            isActive : true


          })
          await newCoupon.save()
          res.render("couponList" , {title:`Luxicart-Coupons` ,couponData })
     
        }
        
    } catch (error) {
        console.log(error);
    }
  }


  const couponDlt = async(req,res)=>{

   try {
    console.log("------------------------  Coupon Delete   -----------------------");
    console.log(req.body);
    const { Id } = req.body
    let couponData = await Coupon.findOne({_id : Id})
    if(couponData){
     let UpdatedcouponData = await Coupon.findOneAndDelete(
        {_id :Id}

      )
      if(UpdatedcouponData){
        console.log(" Deleted");
        res.redirect('/admin/adminPanel/coupon')
      }
      }
     
    
   } catch (error) {
    console.log(error);
    
   }
  }


  module.exports = {
  couponPage,
  genrateCoupon,
  couponDlt

  }