const express = require("express")
const session = require('express-session');
const nocache = require('nocache');
const multer = require("multer")
const path = require("path")

const user_router = express()

const userController = require("../controllers/userController")
const userAccess = require('../middleware/access')

const {isLogin , isLogout} = require("../middleware/auth")
const isBlocked = require("../middleware/access")

const dotenv = require("dotenv")
dotenv.config()

user_router.use(express.json())
user_router.use(express.urlencoded({extended:true}))

//use sessions for tracking logins
user_router.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session data
  resave: false,
  saveUninitialized: true,
}))


const noCache = nocache();
user_router.use(noCache);



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/assests/profile')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Define the filename for the uploaded file
  },
});
const upload = multer({ storage: storage })









//user_router.set("view engine", "ejs")
user_router.set("views", "./views/user")
// user_router.set("views", "./views/admin")


user_router.use('/assets',express.static(path.join(__dirname,'public/assets')));


user_router.get("/",  userController.homePage)
// user_router.get("/homePage",  userController.gethomePage)

user_router.get("/login",  userController.getLoginPage)
user_router.get("/register", userController.getRegisterPage)

user_router.get("/verify-otp", userController.otpPage)
user_router.post("/verify-otp", userController.insertUser)
user_router.get("/resendOtp", userController.resendOtp)



user_router.post("/otp-verified", userController.verify_OTP)

user_router.post("/" , userController.postLogin)

user_router.get("/logout", isLogin, userController.userLogout)


// ------------------ --------------  ----------    Forgot Password     ----------- --- ------

user_router.get('/forgotPSWLink', isLogout , userController.generatePswLink)
user_router.post('/forgotPSWLink', userController.getNewPswd)
user_router.get('/pswdOtp-verified' , userController.pswdOtpPage)
user_router.post("/pswdOtp-verified" , userController.verify_Pswd_OTP)
user_router.post("/NewPswd" , userController.resetPaswrd)




//------------------------------  PROFILE ----------------------------

  const profileController = require("../controllers/userProfileController")

  user_router.get("/userProfile" , isLogin, profileController.profilePage)
  user_router.get("/editprofile/:id" , isLogin ,isBlocked, profileController.editprofile)
  user_router.get("/editdp/:id" , isLogin,isBlocked , profileController.editdp)
  user_router.post("/updateProfile" , isLogin, profileController.updateProfile)
  user_router.post("/editpic" ,upload.single('image'), isLogin, profileController.updateDp)


//----------------------------------------  End PROFILE   --------------------------------------------------

//*-------------------------------------- ITEM DISPLAY  ------------------------------------------------

user_router.get("/itemDisplay/:id" , userController.getitemDisplay)
//*-------------------------------------- ITEM DISPLAY END  ------------------------------------------------



// -------------------------------   SEARCH DISPLAY   -------------------------------------------------

user_router.get('/searchResult', userController.getSearchItems)
user_router.post('/filterItems' , userController.filterItems)
user_router.post('/sortItems' , userController.sortItems)

// ***************************** ADDRESS *********************

// user_router.post("/add-address" , userController.saveAddress)
user_router.get("/adrsPage" , isLogin, userController.adrsPage)


// ****************************WALLET   *********************
user_router.get('/wallet' , isBlocked, isLogin, userController.walletPage)


module.exports = user_router