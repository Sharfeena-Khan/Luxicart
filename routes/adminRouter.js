const express = require("express")
const admin_router = express()
const session = require('express-session');
const nocache = require('nocache');
const path = require("path")
//use sessions for tracking logins
admin_router.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session data
  resave: false,
  saveUninitialized: true,
}))


const noCache = nocache();
admin_router.use(noCache);

const multer = require('multer');


// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Define the destination directory for uploaded files
      cb(null, './public/assests/BannerUploads'); // Change the path as needed
    },
    filename: (req, file, cb) => {
      // Define the file name for the uploaded file
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage });

  const { isLogin, isLogout} = require("../middleware/adminAuth")

const adminController = require("../controllers/adminController")
admin_router.set('views',"./views/admin");
admin_router.use('/assets',express.static(path.join(__dirname,'public/assets')))


admin_router.get("/", isLogout,adminController.getAdmin)
admin_router.post("/adminPanel" , adminController.verifyAdmin)
admin_router.get("/adminPanel",isLogin, adminController.getAdminPanel)
admin_router.get("/adminLogout",isLogin,adminController.adminLogout)
admin_router.get("/adminPanel/customer",isLogin,adminController.loadCustomers)


// Route to handle blocking a user
admin_router.post("/adminPanel/customer/block",  adminController.blockUser);

// Route to handle unblocking a user
admin_router.post("/adminPanel/customer/unblock",  adminController.unblockUser);


// *************************---------------- ORDER MANAGEMENT --------------------*********************************

admin_router.get("/adminPanel/OrderList" ,isLogin, adminController.orderMngmnt)

// ***********  SALES REPORT   **********

admin_router.post('/adminPanel/pdfReport',isLogin, adminController.salesPdfReport)

//  **************************--------------    Banner List   -----------------------**********************

admin_router.get("/adminPanel/banner", isLogin , adminController.getBanner)
admin_router.post("/adminPanel/bannerImageUpload" , isLogin, upload.single('IMG'), adminController.uploadBannerImg)



















module.exports = admin_router




