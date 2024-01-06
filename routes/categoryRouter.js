const express = require("express")
const session = require("express-session")
const path = require('path');
const multer = require('multer');
const categoryRouter = express()



categoryRouter.use(express.json())
categoryRouter.use(express.urlencoded({extended:true}))



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
  const upload = multer({ storage: storage })
  


  


 


  // Configure Multer for file uploads

 
   categoryRouter.set('views',"./views/admin");

   categoryRouter.use('/assets',express.static(path.join(__dirname,'public/assets')));


   const categoryController = require("../controllers/categoryController")


   categoryRouter.get("/" , categoryController.getCategory)
   categoryRouter.get("/create-Category" , categoryController.getCreateCategory)
   categoryRouter.post("/",upload.single('image'), categoryController.addCategory)




   module.exports = categoryRouter