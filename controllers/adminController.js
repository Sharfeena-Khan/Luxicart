const Admin = require("../models/adminModel")
const Product = require("../models/productModel")
const {User} = require("../models/userModels")
const { Payment, Order } = require("../models/orderModel")



const bcrypt = require('bcrypt');
const saltRounds = 10;






const getAdminPanel = async (req,res)=>{
  try {
    //req.session.user_id = adminData._id
        if(req.session.admin ){
          res.render("adminPanel")
        }else{
          res.redirect("/admin")
        }
    
  } catch (error) {
    console.log(error);
    
  }
}


const getAdmin = async (req, res)=>{
  //console.log("Admin");
  try {
    if(req.session.user){
      res.redirect("/adminPanel")
    }else{
      res.render("adminLogin" ,{title:`Luxicart-Admin Login`, })
    }
    
  } catch (error) {
    console.log(error);
    
  }
   
 
}



const verifyAdmin = async(req, res)=>{
  try {
    const {email , password} =req.body
    const adminData = await Admin.findOne({ email:email});

   console.log(email);
      if (adminData) {
        console.log(password);
        if(adminData.password===password){
          
          req.session.admin = true;
          console.log('Before redirect');
          res.redirect("/admin/adminPanel");
          console.log('After redirect');
          
        }
        else{
          console.log("matched Password   :" ,password);

          req.session.admin = false;
          res.render('adminLogin', { title:`Luxicart-Admin Login`, message : "Incorrect Password"});

        }
        
      } else {
       
        res.render('adminLogin', { title:`Luxicart-Admin Login`, message : "You are not a Admin"});
      }
      
    


  } catch (error) {
    console.log(error);
  }
 
  
}


const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
}

//-------------------------------------------------------------------------

const loadCustomers = async(req,res)=>{

 try {

  const userList = await User.find({isAdmin:false})
  const activeStatus = User.find({status:"Active"})
  res.render("View-Customer" ,{userList ,title:`Luxicart-Customer`, } )
  
 } catch (error) {
  console.log(error);
 }
}




const blockUser = async (req, res) => {
  

  try {
    const userId = req.body.userId;
    console.log("Active:" +userId);
    await User.findByIdAndUpdate(userId, {status: "Blocked"})
    res.redirect("/admin/adminPanel/customer");


  } catch (error) {
    console.log(error);
  }
}

const unblockUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log("Blocked:" +userId);
    await User.findByIdAndUpdate(userId, {status: "Active"})
    res.redirect("/admin/adminPanel/customer");


  } catch (error) {
    console.log(error);
  }
}


// *********************************--------------    ORDER MANAGMENT     ---------------------**********************

const orderMngmnt = async(req,res)=>{
  try {
    const orderData = await Order.find()
    .populate('user_id', 'FirstName') 
    console.log(orderData);
    res.render("view-OrderList", {title:`Luxicart-Orders` , orderData})
    
  } catch (error) {
    console.log(error);
  }
}






module.exports = {
  getAdmin,
  verifyAdmin,
  getAdminPanel,
  adminLogout,
  loadCustomers,
  blockUser,
  unblockUser,
  orderMngmnt,

  


}