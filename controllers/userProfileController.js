
const {User} = require("../models/userModels")

const flash = require('express-flash');
const { body, validationResult } = require('express-validator');




const profilePage = async (req, res) =>{
    const userAuthenticated = req.session.user;
    try {
      if(userAuthenticated){
        const user = req.session.userData
        if (user && user._id) {
          
          const userData = await User.findById(user._id);
          if(userData){
            res.render("userProfile" , {title:"Luxicart-Profile" , userAuthenticated , userData })

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
            res.render("editUserProfile" , {title:"Luxicart-Edit Profile" ,userAuthenticated, userData, error: req.flash('error')})

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
       const {ID, Fname ,Lname, Radios, email, phn } = req.body
      try {
        if(userAuthenticated){
          const user = req.session.userData
          const trimmedPhn = phn.trim()
          const updateProfileValidation = [
            body('Fname').matches(/^[a-zA-Z]+$/,'i').withMessage('First name should only contain letters'),
            body('Lname').matches(/^[a-zA-Z]+$/,'i').withMessage('Last name should only contain letters'),
            body('phn').matches(/^\d{10}$/).withMessage('Phone  should be 10 numbers '),
          ];
          await Promise.all(updateProfileValidation.map(validation => validation.run(req)));
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            // If there are validation errors, render or send an error response
            req.flash('error', errors.array().map(error => error.msg));
            return res.redirect('/editprofile/:id');
          }
          if(!trimmedPhn.replace(/\s/g,'').length){
           req.flash('error','Please provide valid phone number')
          return res.redirect('/editprofile/:id')

          }
        
        if (user && user._id) {
          let userData = await User.findById(user._id)
          console.log(userData);
          if(userData){
            userData.FirstName = req.body.Fname
            userData.LastName = req.body.Lname
            userData.gender = req.body.Radios
            userData.email = req.body.email           
            // userData.image = req.file.filename
            userData.phone =req.body.phn

            userData = await userData.save()
            
            
            if(userData){
              console.log(userData);
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







  module.exports = {
    profilePage,
    editprofile,
    updateProfile,
    editdp, 
    updateDp
  }