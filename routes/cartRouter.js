const express = require("express")
const session = require("express-session")
const  path = require("path")
const cartRoute  = express()


const {isLogin, isLogout} = require("../middleware/auth")
const isBlocked = require("../middleware/access")


const { body, validationResult } = require('express-validator');

const flash = require('express-flash');

cartRoute.use(flash())

// const svgCaptcha = require('svg-captcha');

cartRoute.use(express.json())
cartRoute.use(express.urlencoded({extended:true}))


cartRoute.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session data
    resave: false,
    saveUninitialized: true,
  }))


  cartRoute.set("views", "./views/user")

  cartRoute.use('/assets',express.static(path.join(__dirname,'public/assets')));
  
  const cartController = require("../controllers/cartController")

  cartRoute.get("/" , isLogin,isBlocked, cartController.getCart)
  cartRoute.post("/addtoCart/:id" ,isLogin,isBlocked ,cartController.addtoCart)

  cartRoute.get("/delItem/:id" , cartController.delItem)

  cartRoute.post("/update-quantity" , cartController.changeQty)

  // ***********************************  ADDRESS ******************************

  cartRoute.post("/add-address" , cartController.saveAdrs)
  cartRoute.get("/address" ,isBlocked, cartController.getAddressPage)
   cartRoute.post("/payment",isBlocked, cartController.orderPlaced)
  cartRoute.get("/payment" ,isBlocked, cartController.getPaymentPage)

  
  cartRoute.post("/updateMainAddress/:addressId" , cartController.updateMainAddress)

  // -----------------------------  WISHLIST --------------------------
  cartRoute.get("/wishlist" , isBlocked,isLogin , cartController.getWishlist)
  cartRoute.get("/Wishlist/:id" , isBlocked, isLogin, cartController.AddWish)
  cartRoute.post("/wishlist/removeItem/:id", isBlocked, isLogin, cartController.removeWish)

  

 



  module.exports = cartRoute