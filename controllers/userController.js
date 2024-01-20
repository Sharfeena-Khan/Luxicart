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
const { Long } = require("mongodb");
const session = require("express-session");
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
  
  
  console.log("------------------------------  :  Home Page Session : --------------------");
  
  try {
    const pro = await Product.find()
    const  EthnicWear = await Product.find({ category:"Ethnic Wear" }).limit(8);
    const  black = await Product.find({ category: "Black Beauty" }).limit(8);
    const  CasualWear = await Product.find({ category: "Casual Wear" }).limit(8);
    const  OfficeWear = await Product.find({ category: "Office Wear" }).limit(8);
    const  WeddingWear = await Product.find({ category: "Wedding Wear" }).limit(8);
    const  westernWear = await Product.find({ category: "Western Collection" }).limit(8);

    const userId = req.session.user_id
    let userSession = req.session
    let userData = await User.findById(userId)
    // const userAuthenticated = req.session.user;
    // console.log("Home Page **************************", userData);

    if(userData){
      console.log("check 1");
      if( userData.isVerified ){
        console.log("check 2 VErified");
        if(userData.status === 'Active'){
          console.log("check 3 Active");
          res.render("homePage" , { title:"Luxicart-Home" , userAuthenticated:userData, EthnicWear, black, CasualWear, OfficeWear, WeddingWear, westernWear, error: req.flash('error') })
         

        }else{
          console.log("check Blocked Else case");
          res.render("homePage" , { title:"Luxicart-Home" , userAuthenticated :null, EthnicWear, black, CasualWear, OfficeWear, WeddingWear, westernWear, error: req.flash('error') })
        }

        }
    else{
      console.log("check 4 verified else case");
      res.render("homePage" , { title:"Luxicart-Home" , userAuthenticated :null, EthnicWear, black, CasualWear, OfficeWear, WeddingWear, westernWear, error: req.flash('error') })
    }
  }else{
    console.log("check 5 no user case");
    // res.render("homePage" , { title:"Luxicart-Home" , userAuthenticated :null, EthnicWear, black, CasualWear, OfficeWear, WeddingWear, westernWear, error: req.flash('error') })
    res.redirect('/login')
  }
    // console.log("black products:", black);
    
  } catch (error) {
    console.log(error);    
  }
}



//--------------------loginPage---------------- 

const getLoginPage = async(req, res)=>{
  try {
    console.log("Login Page");
    // console.log("Login Page Reached");
      if(req.session.user){
        let userSession = req.session
        let userData = await User.findOne({email: userSession.email})
        if(userData && userData.isVerified && userData.status =="Active"){

          console.log(("======================  Login page Session    " , req.session));
          res.redirect("/")

        }else{
          res.render("loginPage", { title:"Luxicart-Login" , userAuthenticated:null });
    

        }
       
      }
      else{
        
    res.render("loginPage", { title:"Luxicart-Login" , userAuthenticated:null });
      
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
     
        res.render("register" , {title:"Luxicart-SignUp" , userAuthenticated: false })
      }
    catch (error) {
        console.log(error);
    }
   
}







const insertUser = async (req, res) => {
    try {
      console.log("-----------------------     test block     ---------------------");
      console.log("Any session1 : " , req.session);
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
      if (password.length < 8) {
        return res.render('register', { title: "Luxicart-Signup", message: 'Password must be at least 8 characters long', userAuthenticated: req.session.user });
    }
    if(!/[!@#$%^&*()|<>]/.test(password)){
      return res.render('register', { title: "Luxicart-Signup", message: 'Password must have one special characters', userAuthenticated: req.session.user });
  
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
        // isVerified:false,
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
        console.log("otp page User Details : ",user);
        console.log('Session:', req.session);
        console.log('User:', req.session.user);
        res.render("otpVerification", {title:"Luxicart-Signup Verification"  ,User,  userAuthenticated: null})
      } catch (error) {
        
      }
    }


    const verify_OTP = async (req, res) => {
      try {
        console.log("---------------------------           Verifying process -----------------------------");
        const enteredOTP = req.body.otp;
        const sessionUser = req.session.user
        console.log(sessionUser);
        let user = await User.findOne({ email: sessionUser.email });
         console.log("submitting OTP : " , user);
        if(user){
          console.log("ckeck 01");
          if (user.otpExpiration > Date.now()){
            console.log("ckeck 1");
            if(user.otp== enteredOTP){
              console.log("ckeck 2");
             user = await User.updateOne(
                {email:sessionUser.email},
                {$set :
                {
                  isVerified:true, 
                  status: "Active"
                }}
              )
              res.render("loginPage", { title:"Luxicart-Login" , userAuthenticated:null });
              // res.redirect("/login")
              console.log('---------------------    User verified successfully    ----------------');
    
              console.log("=====================Updated User :  ", user);
            }
          }
          // res.render("loginPage", { title:"Luxicart-Login" , userAuthenticated:null });
          // res.redirect("/login")
          // console.log('---------------------    User verified successfully    ----------------');

        }
      
    
        
          else {
            console.log('Invalid OTP or OTP has expired');
            res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'Invalid OTP or OTP has expired' , User :User ,  userAuthenticated: req.session.user});
          }
        // else {
        //   console.log('User not found or invalid OTP');
        //   res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'User not found or invalid OTP' ,User :User ,  userAuthenticated: req.session.user});
        // }
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
            res.render("pswOTP", {title:"Luxicart-Password Verification"  ,User,  userAuthenticated: req.session.user, message: 'User not found or invalid OTP'})

            // res.render('otpVerification', { title:"Luxicart-Signup Verification" , message: 'Invalid OTP or OTP has expired' , User :User ,  userAuthenticated: req.session.user});
          }
        } 
        else {
          console.log('User not found or invalid OTP');
          res.render("pswOTP", {title:"Luxicart-Password Verification"  ,User,  userAuthenticated: req.session.user, message: 'User not found or invalid OTP'})
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
        res.render("adrsList" , {title: "Luxicart-Address", userAuthenticated ,adrsData ,  error: req.flash('error')})

        
      } catch (error) {
        console.log(error);
        
      }
    }

    const addingAdrs = async(req, res, next)=>{
      const userAuthenticated = req.session.user
      try {
          const {name ,zip, locality, Address, place, state, Lmark, altNum ,Radios } = req.body
          console.log("======================================");
          console.log("======================================");
         
          console.log(name);
          const trimmedName = name.trim();
          const trimmedZip = zip.trim()
          const trimmedLocality = locality.trim()
          const trimmedAddress = Address.trim()
          const trimmedPlace = place.trim()
          const trimmedState = state.trim()
          const trimmedLmark = Lmark.trim()
          const trimmedAltNum = altNum.trim()
  
  
          body('name', 'Name is required').notEmpty();
  
          body('zip', 'Zip code is required').notEmpty();
  
          body('zip', 'Invalid zip code').matches(/^\d{5}$/); // Check if zip is a 5-digit number
  
          body('locality', 'Locality is required').notEmpty();
  
          body('Address', 'Address is required').notEmpty();
  
          body('place', 'City is required').notEmpty();
  
          body('state', 'State is required').notEmpty();
  
          body('Lmark', 'Landmark is required').notEmpty();
  
          body('altNum', 'Alternate phone number is required').notEmpty().isNumeric();
  
          body('Radios', 'Address type is required').notEmpty();
  
  
          if(!trimmedName.replace(/\s/g, '').length || !trimmedZip.replace(/\s/g,'').length ||
           !trimmedLocality.replace(/\s/g, '').length || !trimmedAddress.replace(/\s/g, '').length 
           || !trimmedPlace.replace(/\s/g, '').length || !trimmedState.replace(/\s/g,'').length
          || !trimmedLmark.replace(/\s/g,'').length || !trimmedAltNum.replace(/\s/g,'').length)
          {
              req.flash('error', 'Please provide valid values for all required fields.');
              return res.redirect('/adrsPage');
          }
  
  
  
          // Check for validation errors
  
          const errors = validationResult(req);
  
          if (!errors.isEmpty()) {
              // If there are validation errors, render the cart page with the errors
              req.flash('error', errors.array().map(error => error.msg));
              return res.redirect('/adrsPage');
          }
       
          const userAuthenticated = req.session.user
          const userId = req.session.user_id
          let userAdrs = await UserAddress.findOne({user_id : userId})
          if(!userAdrs){
              userAdrs = new UserAddress({
                  user_id : userId,
                  Addresses : []
              })
          }
          // const user = await User.findById(userId)
          const newAdrs = {
              name : name ,
              pincode :zip,
              locality: locality,
              Adrs : Address , 
              city : place,
              state : state,
              landmark : Lmark,
              phoneNum : altNum,
              adrs_type : Radios 
  
          }
          if (!newAdrs.name || !newAdrs.pincode || !newAdrs.locality || !newAdrs.Adrs || !newAdrs.city || !newAdrs.state) {
              req.flash('error', 'Please provide values for all required fields.');
              return res.redirect('/adrsPage');
          }
           userAdrs.Addresses.push(newAdrs)
          const userAddresses= await userAdrs.save()
  
          if(userAddresses){
              let user = await User.findOne({ _id: userId })
           let adrs = {
              name : trimmedName,
              adrsId : userAddresses.adrs_id,
              adrs : trimmedAddress,
              pincode :trimmedZip,
              locality:trimmedLocality , 
              city :trimmedPlace ,
              state :trimmedState ,
              landmark : trimmedLmark,
              phoneNum : trimmedAltNum,
              adrs_type :Radios ,
              mainAdrs : userAddresses.mainAdrs 
                  
  
           }
           user.Addresses.push(adrs)
           await user.save()
           
          }
  
        res.json({success : true})
          // res.redirect("/adrsPage")
          
      } catch (error) {
          console.log(error);
      }

    }

    const getAdrsEditPage = async(req,res)=>{
      console.log("----------------------------------Editing Address Page -----------------");
      const userAuthenticated = req.session.user
      try {
      const id = req.params.id
      const userId = req.session.user_id 
      console.log(id);
      let adrsData = await UserAddress.findOne({ "user_id": userId, })
      // .findIndex((product) => product.product_id == pdt_Id
      const index = adrsData.Addresses.findIndex((adrs) => adrs._id == id);


      
      
      console.log("----------------------------------adrsData : ", adrsData.Addresses[index]);
      res.render('editAddressDetailsPage',{adrsData :adrsData.Addresses[index] , error : req.flash('error') , userAuthenticated } )
     } catch (error) {
      
     }


    }

    const EditAddress = async (req, res) => {
      console.log("--------------------Editing Address------------------------");
      const id = req.body.id;
      const { name, house, Lmark, street, city, state, zip, phn, Radios } = req.body;
      console.log(id);
  
      try {
          // Find the user's address based on _id
          let adrsData = await UserAddress.findOne({ "Addresses._id": id });
  
          // Check if the document was found
          if (!adrsData) {
              console.log("Address not found");
              // You can customize this part based on your requirements, such as redirecting to an error page or rendering a specific message.
              return res.render('errorPage', { errorMessage: 'Address not found' });
          }
  
          // Find the index of the address within Addresses array based on _id
          const index = adrsData.Addresses.findIndex((adrs) => adrs._id == id);
  
          // Check if the index was found
          if (index === -1) {
              console.log("Address index not found");
              // You can customize this part based on your requirements, such as redirecting to an error page or rendering a specific message.
              return res.render('errorPage', { errorMessage: 'Address index not found' });
          }
  
          // Update the specific address data
          adrsData.Addresses[index].name = name;
          adrsData.Addresses[index].Adrs = house;
          adrsData.Addresses[index].landmark = Lmark;
          adrsData.Addresses[index].locality = street;
          adrsData.Addresses[index].city = city;
          adrsData.Addresses[index].state = state;
          adrsData.Addresses[index].pincode = zip;
          adrsData.Addresses[index].phoneNum = phn;
          adrsData.Addresses[index].adrs_type = Radios;
  
          // Save the updated document
          await adrsData.save();
  
          console.log("Address updated successfully");
  
          // Redirect or send a response as needed
          res.redirect('/adrsPage'); // Change this to your desired redirect URL
      } catch (error) {
          // Handle any errors that might occur during the process
          console.error(error);
          // You can customize this part based on your requirements, such as redirecting to an error page or rendering a specific message.
          res.render('errorPage', { errorMessage: 'An error occurred' });
      }
  };

  const delAdrs = async(req,res)=>{
    console.log("----------------------Deleating-----------------");
    try {
      const id = req.params.id
      console.log(id);
      const data = await UserAddress.updateOne(
        { "Addresses._id" : id},
        {$pull : { Addresses : {_id : id}}}
      )
      console.log(data);
      if(data.modifiedCount >0){
        res.redirect('/adrsPage')
      }else {
        console.log("Address not found");
        res.status(404).json({ message: 'Address not found' });
    }
    } catch (error) {
      console.log(error);
    }
  }
  

    // *******************************--------------  SEARCH  &   FILTER  -----------------****************************
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

const sortItems = async(req,res)=>{
  try {
    
  } catch (error) {
    console.log(error);
  }
}
    
    // ----------------------------   WALLET    ---------------------

  const walletPage = async(req, res) => {
    try {
      const userAuthenticated = req.session.user;
      const userId = req.session.user_id;
      const userData = await User.findById(userId)
      console.log("user :" ,userData);
      res.render("wallet" ,{userAuthenticated , userData})
    
  } catch (error) {
    console.log(error);
  }

    
  }



  

   

 



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
    addingAdrs,
    getAdrsEditPage,
    EditAddress,
    delAdrs,

    getSearchItems,
    filterItems,
    sortItems,

    walletPage

   
   
    
    
}