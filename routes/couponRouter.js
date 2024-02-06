const express = require("express")
const session = require("express-session")
const path = require('path');

const CouponRouter = express()

const { isLogin, isLogout} = require("../middleware/adminAuth")


CouponRouter.use(express.json())
CouponRouter.use(express.urlencoded({extended:true}))



CouponRouter.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session data
    resave: false,
    saveUninitialized: true,
  }))


  CouponRouter.set('views',"./views/admin");

  CouponRouter.use('/assets',express.static(path.join(__dirname,'public/assets')));

  const CouponController = require("../controllers/couponController")


CouponRouter.get('/', isLogin, CouponController.couponPage)
CouponRouter.post('/create-Coupon', CouponController.genrateCoupon)
CouponRouter.post('/couponDlt', CouponController.couponDlt)


 


  module.exports= CouponRouter