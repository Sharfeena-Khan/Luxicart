const {User , UserAddress} = require("../models/userModels")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")

const { WishList , Cart } = require("../models/cartModel")

const Joi = require("joi");

const dotenv = require("dotenv")

const flash = require('express-flash')

dotenv.config()

const nodemailer = require('nodemailer');

const { body, validationResult, Result } = require('express-validator');


const bcrypt = require('bcrypt');
const { Long } = require("mongodb")
const saltRounds = 10;


const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
      user: process.env.AUTH_EMAIL,
      pass:  process.env.AUTH_PASS
  },
});

const generateRandomOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};







//------------------------home Page-----------------

const homePage = async (req, res) =>{
  const userAuthenticated = req.session.user;
  
  try {
    const pro = await Product.find()
    const  EthnicWear = await Product.find({ category:"Ethnic Wear" }).limit(8);
    const  black = await Product.find({ category: "Black Beauty" }).limit(8);
    const  CasualWear = await Product.find({ category: "Casual Wear" }).limit(8);
    const  OfficeWear = await Product.find({ category: "Office Wear" }).limit(8);
    const  WeddingWear = await Product.find({ category: "Wedding Wear" }).limit(8);
    const  westernWear = await Product.find({ category: "Western Collection" }).limit(8);


    // console.log("black products:", black);
    res.render("homePage" , { title:"Luxicart-Home" , userAuthenticated, EthnicWear, black, CasualWear, OfficeWear, WeddingWear, westernWear, error: req.flash('error') })
    
  } catch (error) {
    console.log(error);    
  }
}



//--------------------loginPage---------------- 

const getLoginPage = async(req, res)=>{
  try {
    // console.log("Login Page Reached");
      if(req.session.user){
        res.redirect("/")
      }
      else{
        const userAuthenticated = req.session.user;
    res.render("loginPage", { title:"Luxicart-Login" , userAuthenticated });
      
      }
  } catch (error) {
      console.log(error);
  }
 
}






const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isVerified  ) {
          if (userData.status === "Active"){

            req.session.userData = userData
            req.session.user_id = userData._id;
            req.session.user = true;            
            res.redirect("/");

          }
          else{
            res.render("loginPage", { title:"Luxicart-Login" , message: "Your Access is denied" , userAuthenticated: req.session.user});

          }
         
          
          
          }
          
         else {
          res.render("loginPage", { title:"Luxicart-Login" , message: "OTP is not verified" , userAuthenticated: req.session.user});
        }
      } else {
        res.render('loginPage', { title:"Luxicart-Login" , message: "Invalid User details" , userAuthenticated: req.session.user });
      }
    } else {
      res.render('loginPage', { title:"Luxicart-Login" , message: "Invalid User details" , userAuthenticated: req.session.user});
    }
  } catch (error) {
    console.log(error); // Corrected the variable name here
    res.status(500).send("Internal Server Error");
  }
}






//----------------------- RgisterPage --------------

const getRegisterPage = async(req, res)=>{
    try {
      if(req.session.user){
        res.redirect("/")
      }else{ 
        res.render("register" , {title:"Luxicart-SignUp" , userAuthenticated: false })
      }
    } catch (error) {
        console.log(error);
    }
   
}







const insertUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate and sanitize email and password
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('register', { title:"Luxicart-Signup" , errors: errors.array() , userAuthenticated: req.session.user });
      }
  
      const existingUser = await User.findOne({ email:email });
  
      if (existingUser) {
        return res.render('register', { title:"Luxicart-Signup" , message: 'Email address already exists', userAuthenticated: req.session.user });
      }
  
      
       // Add this line to log the value of 'password'
    console.log('Salt Rounds:', saltRounds);

    if (/^\s*$/.test(password)) {
        return res.render('register', { title:"Luxicart-Signup" , message: 'Password cannot be only whitespace', userAuthenticated: req.session.user });
      }

      const otp = generateRandomOTP();
      //hash otp
      // const hashedOTP = await bcrypt.hash(otp,saltRounds)
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('Password:', password);
      const user = new User({
        email : email,
        password: hashedPassword,
        isVerified:false,
        otp: otp,
        otpExpiration: Date.now() + 30000,
      });
  
      const userData = await user.save();
         

       // Send the OTP to the user's email using Nodemailer
       const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email, // The user's email address
        subject: ' OTP Verification',
        text: ` ${otp} is your Luxicart verification code.` 
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.status(500).send("Failed to send OTP email.");
      } else {
          console.log('Email sent: ' + info.response);
          console.log('User before session set:', user);

          req.session.user = {
            email: user.email,
            // ... (other user properties)
          };
        
          console.log('User after session set:', req.session.user);
        
          res.redirect('/verify-otp'); // Redirect to the OTP entry page
      }
  });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };


  //--------------------  OTP ---------------

  const otpPage = async(req, res)=>{
      try {
        const user = req.session.user;
        console.log("huhfuy",user);
        console.log('Session:', req.session);
        console.log('User:', req.session.user);
        res.render("otpVerification", {title:"Luxicart-Signup Verification"  ,User,  userAuthenticated: req.session.user})
      } catch (error) {
        
      }
    }


    const verify_OTP = async (req, res) => {
      try {
        const enteredOTP = req.body.otp;
    
        // Find the user with the entered OTP
        const user = await User.findOne({ otp: enteredOTP });
    
        if (user) {
          if (user.otpExpiration > Date.now()) {
            user.isVerified = true;
            if(user.isVerified){
              user.status = "Active"
            }else{
              user.status = "Blocked"
            }
            await user.save();
            console.log('User verified successfully');
            
            //res.redirect('/login?message=Your%20Registration%20with%20Luxicat%20is%20completed.%20Now%20you%20can%20Login%20from%20here.');

            
            res.redirect('/login' ); 
          } else {
            console.log('Invalid OTP or OTP has expired');
            res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'Invalid OTP or OTP has expired' , User :User ,  userAuthenticated: req.session.user});
          }
        } else {
          console.log('User not found or invalid OTP');
          res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'User not found or invalid OTP' ,User :User ,  userAuthenticated: req.session.user});
        }
      } catch (error) {
        console.error('Error in verify_OTP:', error);
        res.status(500).send('Internal Server Error');
      }
    };


    const resendOtp = async(req, res)=>{
      try {
        const {email} =req.session.user

       
        // Check if the email is available in the session
        if (!email) {
          return res.status(400).send('Email not found in the session');
        }
    
        // Find the user by email
        const user = await User.findOne({ email });
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Generate a new OTP
        const newOTP = generateRandomOTP();
    
        // Update the user's OTP and expiration
        user.otp = newOTP;
        user.otpExpiration = Date.now() + 30000;
        await user.save();
    
        // Send the new OTP to the user's email using Nodemailer
        const mailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: 'Resending OTP Verification',
          text: `${newOTP} is your new Luxicart verification code.`,
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send('Failed to send OTP email.');
          } else {
            console.log('Email sent: ' + info.response);
            res.redirect('/verify-otp'); // Redirect to the OTP entry page
          }
        });
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    };









    
    
    const userLogout = async (req, res) => {
      try {
        req.session.destroy();
        res.redirect("/");
      } catch (error) {
        console.log(error);
      }
    }



    // -----------------------    ------*** FORGOT PASSWORD   ****------- ----------------------

    const generatePswLink = async(req, res)=>{
      console.log("Forgot Password" );
      try {

        const userAuthenticated = req.session.user;
       res.render("forgotPwd" ,  { title:"Luxicart-Forgot Password" , userAuthenticated })
      } catch (error) {
        console.log(error);
      }
    }



    const getNewPswd = async(req, res)=>{
      try {
        const {email} =req.body

       console.log(email);
        // Check if the email is available in the session
        if (!email) {
          return res.status(400).send('Email not found in the session');
        }
    
        // Find the user by email
        const user = await User.findOne({ email });
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Generate a new OTP
        const newOTP = generateRandomOTP();
    
        // Update the user's OTP and expiration
        user.otp = newOTP;
        user.otpExpiration = Date.now() + 36000;
        await user.save();
    
        // Send the new OTP to the user's email using Nodemailer
        const mailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: 'Resending OTP Verification',
          text: `${newOTP} is your new Luxicart verification code.`,
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send('Failed to send OTP email.');
          } else {
            console.log('Email sent: ' + info.response);
            res.redirect('/pswdOtp-verified'); // Redirect to the OTP entry page
          }
        });

        
      } catch (error) {
        console.log(error);
      }
    }


    const pswdOtpPage = async(req, res)=>{
      try {
        const user = req.session.user;
        console.log("huhfuy",user);
        console.log('Session:', req.session);
        console.log('User:', req.session.user);
        res.render("pswOTP", {title:"Luxicart-Password Verification"  ,User,  userAuthenticated: req.session.user})
      } catch (error) {
        
      }
    }
    

    const verify_Pswd_OTP = async (req, res) => {
      try {
        const enteredOTP = req.body.otp;
    
        // Find the user with the entered OTP
        const user = await User.findOne({ otp: enteredOTP });
    
        if (user) {
          if (user.otpExpiration > Date.now()) {
            user.isVerified = true;
            if(user.isVerified){
              user.status = "Active"
            }else{
              user.status = "Blocked"
            }
            await user.save();
            console.log('User verified successfully');
            console.log("*****************************************");
            // console.log(user);
            res.render("resetPassword" , {title:"Luxicart-Password Verification"  ,user,  userAuthenticated: req.session.user})
            //res.redirect('/login?message=Your%20Registration%20with%20Luxicat%20is%20completed.%20Now%20you%20can%20Login%20from%20here.');

            
            
          } else {
            console.log('Invalid OTP or OTP has expired');
            res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'Invalid OTP or OTP has expired' , User :User ,  userAuthenticated: req.session.user});
          }
        } else {
          console.log('User not found or invalid OTP');
          res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'User not found or invalid OTP' ,User :User ,  userAuthenticated: req.session.user});
        }
      } catch (error) {
        console.error('Error in verify_OTP:', error);
        res.status(500).send('Internal Server Error');
      }
    };

    const resetPaswrd = async (req, res) => {
      const saltRounds = 6;
      console.log("New Password entered");
      const { email, newPswd } = req.body;
      console.log("Details ", req.body);
    
      let userData = await User.findOne({ email: email });
    
      if (userData) {
        console.log('Salt Rounds:', saltRounds);
        let userId = userData._id;
        console.log('User ID:', userId);
    
        // Check if newPswd is defined and not empty
        if (newPswd) {
          const hashedPassword = await bcrypt.hash(newPswd, saltRounds);
          console.log('Hashed Password:', hashedPassword);
    
          userData = await User.findByIdAndUpdate(
            userId,
            {
              $set: { password: hashedPassword },
            },
            { new: true }
          );
    
          const updatedUser = await userData.save();
    
          if (updatedUser) {
            req.session.userData = userData;
            req.session.user_id = userData._id;
            req.session.user = true;
            return res.redirect("/");
          }
        } else {
          console.error("New password is missing or empty.");
          return res.status(400).send("New password is missing or empty.");
        }
      } else {
        res.render("loginPage", {
          title: "Luxicart-Login",
          message: "Your Access is denied",
          userAuthenticated: req.session.user,
        });
      }
    };
    


    //***********************************   ITEM DISPLAY    ***************************************/

    const getitemDisplay = async(req, res)=>{
      const userId = req.session.user_id
      const wishListData = await WishList.findOne({user_id : userId}).populate("products");
      const pdt_Id = req.params.id
       const userAuthenticated = req.session.user

      try {
        const product = await Product.findById(pdt_Id)
       

        res.render("itemDisplay" , {title:`Luxicart-${product.name}` ,userAuthenticated , product,wishListData })
       
        
      } catch (error) {
        console.log(error)
      }
    }


    // ***************************--------- ADDRESS LIST  ------------------*******************

    const adrsPage = async(req, res)=>{
      const userAuthenticated = req.session.user;
      const userId = req.session.user_id;
      const adrsData = await UserAddress.findOne({user_id : userId})
      
      try {
        console.log(adrsData);
        res.render("adrsList" , {title: "Luxicart-Address", userAuthenticated , adrsData:adrsData})

        
      } catch (error) {
        console.log(error);
        
      }
    }


    const getSearchItems = async (req, res) => {
      try {
        const category = await Category.find();
        const prdt = await Product.find()
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;
        let searchKey = req.query.search;
       
    
        // Check if searchKey is defined before using it
        if (searchKey !== undefined) {
          searchKey = searchKey.trim();
    
          if (searchKey.length > 0) {
            let keyMatch = await Product.find({
              $or: [
                { name: { $regex: searchKey, $options: 'i' } },
                { category: { $regex: searchKey, $options: 'i' } },
              ],
            });
    // console.log("********************" , searchKey);
            if (keyMatch.length > 0) {
              res.render("displayAllCategories", {
                title: `Luxicart-${searchKey}-All Category`,
                userAuthenticated,
                keyMatch,prdt,
                category,
                searchKey
              });
            } else {
              res.redirect("/");
            }
          } else {
            res.redirect("/");
          }
        } else {
          // Handle the case when req.query.search is undefined
          res.redirect("/");
        }
      } catch (error) {
        console.log(error);
      }
    };
    

    const filterItems = async (req, res) => {
      try {
        let searchKey = req.body.query;
        console.log("my word: ",searchKey);
        let selectedCategories = req.body.category || [];
        console.log("before:",selectedCategories);
        // if(!Array.isArray(selectedCategories)){
        //   selectedCategories = [selectedCategories]
        // }else{
        //   selectedCategories = [selectedCategories]
        // }
        console.log("after", selectedCategories);
        const minimumCost = req.body.minPrice
        const maxCost = req.body.maxPrice
        const selectedDiscounts = req.body.discount || [];
        
        console.log(selectedCategories);

       
    
        const filteredItems = await Product.find({
          $or: [
            { name: { $regex: searchKey, $options: 'i' } },
            { description: { $regex: searchKey, $options: 'i' } },
            { category: { $regex: searchKey, $options: 'i' } },
          ],
          category:  { $in: selectedCategories },
          price: { $gte: minimumCost, $lte: maxCost },
          // discount: { $in: selectedDiscounts },
        });
         console.log(filteredItems);
         if (filteredItems.length > 0) {
          res.json({ success: true, filteredItems });

        }else{
          res.json({ success: false, error: 'Internal Server Error' });

        }
        
      } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: 'Internal Server Error' });
      }
    };
    
    



  

   

 



module.exports  = {
    getRegisterPage,
    getLoginPage,
    homePage,
    insertUser,
  verify_OTP,
    otpPage,
    resendOtp,

    generatePswLink, // Direct to forgot Page
    pswdOtpPage, //otp entring page
    getNewPswd, //generating otp and mailing
    verify_Pswd_OTP,
    resetPaswrd,

  
    postLogin,
    userLogout,


    getitemDisplay,
    adrsPage,

    getSearchItems,
    filterItems

   
   
    
    
}