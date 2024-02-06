const express = require("express")

const session = require("express-session")
const path = require('path');

const multer = require('multer');
const cropper = require('cropperjs')

const { isLogin, isLogout} = require("../middleware/adminAuth")

const product_router = express()

const productController = require("../controllers/productController")


product_router.use(express.json())
product_router.use(express.urlencoded({extended:true}))



product_router.use(session({
    secret: 'your-secret-key', // Replace with a secret key for session data
    resave: false,
    saveUninitialized: true,
  }))


  //----------------  multer - --------------

 
  const Storage = multer.diskStorage({
      destination: function (req, file, cb) {
            // cb(null, path.join(__dirname, ))
                    
           cb(null, './public/assests/productsUploads')
      },
      filename: function (req, file, cb) {
        // cb(null, new Date().toISOString() + file.originalname);
          cb(null, Date.now() + '-' + file.originalname); // Define the filename for the uploaded file
      },
      
  });
  
  const Upload = multer({ storage: Storage });
  


  
  // const subUpload = multer({ storage: Storage });



 
  


  


 


  // Configure Multer for file uploads

  product_router.set('views',"./views/admin");

  product_router.use('/assets',express.static(path.join(__dirname,'public/assets')));


 product_router.get("/" ,isLogin, productController.getProductPage)
 product_router.get("/add-product" ,isLogin, productController.getAddProduct)
 product_router.post("/", Upload.single("IMG"), productController.insertProduct); 
 product_router.post("/", Upload.fields([{ name: 'IMG', maxCount: 1 }]), productController.insertProduct); 
 product_router.get("/edit-products/:id" , isLogin, productController.editProducts)
 product_router.delete("/dltPdt" ,isLogin, productController.dltPdt)
 product_router.post('/unlistPdt', isLogin, productController.unlistPdt)
 product_router.post("/updatPrdt", productController.updateProduct)

 product_router.post("/updatPrdtImage" , Upload.fields([
  { name: 'main_IMG', maxCount: 1 },
  // { name: 'sub_Img', maxCount: 6 }, // Adjust maxCount as needed
]), productController.updatePrd_Image)
product_router.post("/updatPrdtSumImage", Upload.fields([ {name: "sub_Img", maxCount:6}]), productController.uploadSumImg)

product_router.post("/delImg", isLogin, productController.delImg)



















module.exports = product_router