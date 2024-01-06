const express = require("express")
const session = require("express-session")
const  path = require("path")
const orderRoute  = express()

const {isLogin, isLogout} = require("../middleware/auth")
const isBlocked = require("../middleware/access")

orderRoute.use(express.json())
orderRoute.use(express.urlencoded({extended:true}))

orderRoute.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session data
    resave: false,
    saveUninitialized: true,
  }))

  orderRoute.set("views", "./views/user")
  orderRoute.set("view engine", "ejs");
  orderRoute.use('/assets',express.static(path.join(__dirname,'public/assets')));
  

  const orderController = require("../controllers/orderController")

orderRoute.get("/" , isLogin,isBlocked, orderController.userOrderList)


orderRoute.get("/orderConformed",isLogin,isBlocked, orderController.getConformed)
orderRoute.post("/orderPlaced",isLogin,isBlocked, orderController.Payment)

//  orderRoute.post("/RazorpayConformed", isBlocked,isLogin, orderController.RazorOrder)
 orderRoute.post("/razorpay-payment-confirmation", orderController.razorpayPaymentConfrm)
// orderRoute.post("" , orderController.RazoSignature)
// /orderList/orderConformed
orderRoute.get("/delOrder/:id" , isLogin ,isBlocked, orderController.cancelOrder)
orderRoute.get("/return/:id" ,isLogin,isBlocked, orderController.returnOrder )








module.exports = orderRoute