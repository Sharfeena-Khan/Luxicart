const express = require("express")
const session = require("express-session")
const path = require('path');
const multer = require('multer');
const categoryRouter = express()

const { isLogin, isLogout} = require("../middleware/adminAuth")


categoryRouter.use(express.json({ limit: '50mb'}))
categoryRouter.use(express.urlencoded({ limit: '50mb', extended: true }))



categoryRouter.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session data
    resave: false,
    saveUninitialized: true,
  }))


  //----------------  multer  --------------

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/assests/categoryUploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Define the filename for the uploaded file
    },
  });
  // const storage = multer.memoryStorage()
  const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } })
  


  


 


  // Configure Multer for file uploads

 
   categoryRouter.set('views',"./views/admin");

   categoryRouter.use('/assets',express.static(path.join(__dirname,'public/assets/categoryUploads/cropped')));


   const categoryController = require("../controllers/categoryController")


   categoryRouter.get("/" ,isLogin, categoryController.getCategory)
   categoryRouter.get("/create-Category" ,isLogin, categoryController.getCreateCategory)
   categoryRouter.post("/",upload.single('image'), categoryController.addCategory)
   categoryRouter.get("/edit-category/:id" , isLogin, categoryController.editCategory)
   categoryRouter.post('/updateCategory', isLogin, categoryController.updateCategory)
   categoryRouter.post('/updateCategoryImage', isLogin , upload.single('main_IMG'), categoryController.updateImage)
   categoryRouter.post('/unlist-category', isLogin, categoryController.unlistCategory)
   categoryRouter.delete('/softDel-category', isLogin, categoryController.softDelete)



   module.exports = categoryRouter