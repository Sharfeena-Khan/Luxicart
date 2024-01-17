const express = require("express")
const path = require("path")
const morgan = require("morgan")

const session = require('express-session');


const nocache = require('nocache');


const app = express()

const flash = require('express-flash');
app.use(flash());

const dotenv = require("dotenv")

dotenv.config()
const db = require("./config/DBconnection")
const port = process.env.PORT || 8080 


//Middleware for handling JSON data
app.use(express.json())

//Handling Data submitted through HTML forms.
app.use(express.urlencoded({extended:true}))

const noCache = nocache()


//use sessions for tracking logins
app.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session data
  resave: false,
  saveUninitialized: true,
}))


// ************************ MORGAN  ******************************

// app.use(morgan(':method :url :status :res[content-length] - :response-time ms '))


//************************** VIEW ENGINE SETUP ********************/

app.set("view engine", "ejs")
app.set("views", "./views")



//----------------- LOAD STATIC ---------------

app.use(express.static(path.join(__dirname, "public")));
app.use('/assets',express.static(path.join(__dirname,'public/assets')))



//-------------------------- USER-ROUTERS  -----------------

const UserRouter = require("./routes/userRouter")
app.use("/", UserRouter)




//-------------------------- ADMIN-ROUTERS  -----------------

const AdminRouter = require("./routes/adminRouter")
app.use("/admin", AdminRouter)


//-------------------------- CATEGORY-ROUTERS  -----------------

const CategoryRouter = require("./routes/categoryRouter")
app.use("/admin/adminPanel/category", CategoryRouter)



//-------------------------- PRODUCT-ROUTERS  -----------------

const ProductRouter = require("./routes/productRouter")
app.use("/admin/adminPanel/products" , ProductRouter )




//--------------------------  CART - ROUTERS  -----------------

const CartRouter = require("./routes/cartRouter")
app.use("/cart" , CartRouter )


//--------------------------  ORDER - ROUTERS  -----------------

const OrderRouter = require("./routes/OrderRouter")
app.use("/orderList" , OrderRouter )








app.listen(port , ()=>{
    console.log(`Server is runs at http://localhost:${port}`);
})