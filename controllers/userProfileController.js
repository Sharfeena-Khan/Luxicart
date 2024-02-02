
const {User} = require("../models/userModels")

const flash = require('express-flash');
const { body, validationResult } = require('express-validator');

const bcrypt = require('bcrypt');
const saltRounds = 10;


const profilePage = async (req, res) =>{
    const userAuthenticated = req.session.user;
    try {
      if(userAuthenticated){
        const user = req.session.userData
        if (user && user._id) {
          
          const userData = await User.findById(user._id);
          if(userData){
            res.render("userProfile" , {title:"Luxicart-Profile" , userAuthenticated:userData, userData })

          }
          else{
            res.status(404).send("User data not found.");
          }
         

      } else{
        res.status(400).send("User session data is incomplete.")

      }
      
     
    }
      
    } catch (error) {
      console.log(error);    
    }
  }


  const editprofile = async (req, res) =>{
    const id = req.params.id
    console.log("get method : ",id);
    const userAuthenticated = req.session.user;
    try {
      if(userAuthenticated){
        const user = req.session.userData
        if (user && user._id) {
          
          const userData = await User.findById(user._id);
          if(userData){
            res.render("editUserProfile" , {title:"Luxicart-Edit Profile" ,userAuthenticated, userData, })

      }else{
        res.status(404).send("User data not found.");
      }
       
     
      
    }else{
      res.status(400).send("User session data is incomplete.")
    } 
  }
}

  catch (error) {
      console.log(error);    
    }
  }


  const editdp = async (req, res) =>{
    const id = req.params.id
    console.log("get method : ",id);
    const userAuthenticated = req.session.user;
    try {
      if(userAuthenticated){
        const user = req.session.userData
        if (user && user._id) {
          
          const userData = await User.findById(user._id);
          if(userData){
            res.render("dpedit" , {title:"Luxicart-Profile Edit" , userAuthenticated, userData })

      }else{
        res.status(404).send("User data not found.");
      }
       
     
      
    }else{
      res.status(400).send("User session data is incomplete.")
    } 
  }
}

  catch (error) {
      console.log(error);    
    }
  }





  

  const updateProfile = async(req, res)=>{
    const userAuthenticated = req.session.user;
       const {ID, Fname , Radios, email, phn } = req.body
      try {
        if(userAuthenticated){
          const user = req.session.userData
          console.log("Phone : ", phn);
          console.log(req.body);
          const trimmedPhn = phn.trim()
          const updateProfileValidation = [
            body('Fname').matches(/^[a-zA-Z\s]+$/,'i').withMessage('First name should only contain letters'),
            // body('Lname').matches(/^[a-zA-Z]+$/,'i').withMessage('Last name should only contain letters'),
            body('phn').matches(/^\d{10}$/).withMessage('Phone  should be 10 numbers '),
          ];
          await Promise.all(updateProfileValidation.map(validation => validation.run(req)));
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            // If there are validation errors, render or send an error response
            req.flash('error', errors.array().map(error => error.msg));
            // return res.redirect('/editprofile/:id');
            return res.json({ success: false, errors: errors.array().map(error => error.msg) });
          }
          if(!trimmedPhn.replace(/\s/g,'').length){
           req.flash('error','Please provide valid phone number')
          // return res.redirect('/editprofile/:id')
          return res.json({ success: false, 
                      errors: ['Please provide a valid phone number'] });

          }
        
        if (user && user._id) {
          // let userData = await User.findById(user._id)
          // console.log("-*-*-*-*-*-*-*--*-*--*-*-**---*----------",userData);
          // if(userData){
          //   userData.FirstName = req.body.Fname
           
          //   userData.gender = req.body.Radios
          //   userData.email = req.body.email           
          //   // userData.image = req.file.filename
          //   userData.phone =req.body.phn

          //   userData = await userData.save()
            
            
          //   if(userData){
          //     console.log(userData);
          //     req.session.userData = userData
          //     res.redirect("/userProfile")

          //   }
          // }
        let  userData = await User.findByIdAndUpdate(
          user._id,
          {$set : {
            Name : Fname,
            phone : phn,
            gender : Radios
          }},
          
        )
        console.log("*******************   Updated User    *********" , userData);
        if(userData){
              console.log(userData);
              req.session.userData = userData
              res.json({ success: true, userData })

              // res.redirect("/userProfile")

            }

        }
           
          }

          //console.log(userData._id);
        }
          
        
       catch (error) {
        console.log(error);
        
      }
 
  }


  const updateDp = async(req, res)=>{
    const userAuthenticated = req.session.user;
     
      try {
        if(userAuthenticated){
          const user = req.session.userData
        
        if (user && user._id) {
          let userData = await User.findById(user._id)
          
          if(userData){
                     
            userData.image = req.file.filename
          

            userData = await userData.save()
            
            
            if(userData){
              
              req.session.userData = userData
              res.redirect("/userProfile")

            }
          }
         

        }
           
          }

          //console.log(userData._id);
        }
          
        
       catch (error) {
        console.log(error);
        
      }
 
  }

  const chngPassword = async(req,res)=>{
   try {
    const {Current, newPsw } = req.body
    console.log(req.body);
    const userAuthenticated = req.session.user;
    if(userAuthenticated){
      const userId = req.session.user_id
    const userData = await User.findById(userId)
    console.log(userData);

    if (/^\s*$/.test(newPsw)) {
      return res.json({ success: false, 
        errors: ['Password cannot be only whitespace'] });
      // return res.render('register', { title:"Luxicart-Signup" , message: 'Password cannot be only whitespace', userAuthenticated: req.session.user });
    }

    if (newPsw.length < 8) {
      return res.json({ success: false, 
        errors: ['Password must be at least 8 characters long'] });
      // return res.render('register', { title: "Luxicart-Signup", message: 'Password must be at least 8 characters long', userAuthenticated: req.session.user });
  }

  if(!/[!@#$%^&*()|<>]/.test(newPsw)){
    // req.flash('error','Password must have one special characters : (!/[!@#$%^&*()|<>]/.')
    // return res.render('register', { title: "Luxicart-Signup", message: 'Password must have one special characters : (!/[!@#$%^&*()|<>]/. ', userAuthenticated: req.session.user });
    return res.json({ success: false, 
      errors: ['Password must have one special characters : (!/[!@#$%^&*()|<>]/.'] });

  }
  console.log("****************");
    if(userData){
      const passwordMatch = await bcrypt.compare(Current , userData.password)
      if(passwordMatch){
        if( userData.isVerified && userData.status === "Active"){
        
          const hashedPassword = await bcrypt.hash(newPsw, saltRounds);
         const newUser =  await User.findByIdAndUpdate(
            userId,
           {$set : {password : hashedPassword}},
           {new: true}
          )
         console.log(newPsw);
          console.log("new", newUser);
          res.json({ success: true, newUser })
  
        }

      }else{
        return res.json({ success: false, 
          errors: ['Password not match'] });
    
      }
      
    }
    }
   } catch (error) {
    console.log(error);
   }
     
  }







  module.exports = {
    profilePage,
    editprofile,
    updateProfile,
    editdp, 
    chngPassword,
    updateDp
  }