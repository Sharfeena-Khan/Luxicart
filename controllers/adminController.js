const Admin = require("../models/adminModel")
const Product = require("../models/productModel")
const {User} = require("../models/userModels")
const { Payment, Order } = require("../models/orderModel")
const Coupon = require("../models/coupon")
const Banner = require("../models/bannerModel")



const bcrypt = require('bcrypt');
const { render } = require("ejs");
const saltRounds = 10;

const pdfkit = require('pdfkit');
const fs = require('fs');






const getAdminPanel = async (req, res) => {
  try {
    const selectedDays = req.query?.selectedDays ?? 0;

    console.log("Selected Days: ", selectedDays);

    let startDate;
    let endDate;

    if (selectedDays == 0) {
      startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (selectedDays == 7) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    } else if (selectedDays == 30) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date();
    }

    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const salesData = await Order.aggregate([
      {
        $unwind: '$items',
      },
      {
        $match: {
          'items.orderPlaced': {
            $gte: startDate,
            $lt: endDate,
          },
          'items.orderStatus': {$ne : "Canceled"}
        },
      },
      { $group: { _id: null, totalSales:  {$sum: {$multiply : ["$items.price" , "$items.quantity"]}} } },
    ]);
    
    // ------------   REVENUE DATA   ---------
  const revenueData = await Order.aggregate([
    {$unwind : '$items'} , 
    {$match : {
      'items.orderPlaced':{ $gte: startDate, $lt: endDate,},
      'items.orderStatus': {$eq : "Delivered"}
    }},
    {$group :{
      _id : null , 
      TotalRevenue :  {$sum: {$multiply : ["$items.price" , "$items.quantity"]}}
    }}
     
  ])

  //    --------------------    MOST SOLD ITEMS     -----------------
  const mostSoldData = await Order.aggregate([
    {$unwind: '$items'},
    {$match : {  'items.orderPlaced':{ $gte: startDate, $lt: endDate,} }},
    {$group : {
      _id : '$items.productName',
      totalQty : { $sum : "$items.quantity"},
    }},
    {$sort : {totalQty : -1} },
    {$limit : 5}
  ])

    console.log(`Days: ${selectedDays}`, salesData);
    console.log("revenue : ", revenueData);
    console.log("Most sold : " , mostSoldData);

    const userCount = await User.countDocuments();

    const responseData = { 
      salesData: salesData[0]?.totalSales || 0, // Access the correct variable from salesData
        userCount: userCount,
        revenueData: revenueData[0]?.TotalRevenue || 0, // Access the correct variable from revenueData
        mostSoldData: mostSoldData,

    }
    
  console.log("************************************************");
  console.log(responseData);
  
   
  if (req.session.admin) {
    // If it's an AJAX request, respond with JSON
    if (req.headers.accept.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json');
      res.json(responseData);
    } else {
      // If it's a regular page load or a fetch request, render the HTML page
      res.render('adminPanel', {
        salesData: salesData[0]?.totalSales || 0,
        userCount: userCount,
        revenueData: revenueData[0]?.TotalRevenue || 0,
        mostSoldData: mostSoldData,
      });
    }
  } else {
    res.redirect('/admin');
  }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};



const salesPdfReport = async(req, res) =>{
  console.log("*****************************    SALES REPORT    ********************");
  try {
    
    const {reportDetails} = req.body;
    console.log(reportDetails);

     const pdfDoc = new pdfkit();
        pdfDoc.pipe(fs.createWriteStream(`Sales Report.pdf`));


        // Add details to the PDF
        // pdfDoc.font('Helvetica-Bold'); // Set font to bold
        // pdfDoc.text(`Invoice for Item ID: ${itemId}`);
        // pdfDoc.font('Helvetica'); // Reset font to the default
        if (reportDetails) {
            pdfDoc.text(`Total Sales: ${reportDetails.totalSales}`);
            pdfDoc.text(`Total Revenue: ${reportDetails.totalRevenue}`);
            
            // Add more details as needed
            // ...

            // Add address details
           }
        

        pdfDoc.end();

        // Send the generated PDF as a response
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `attachment; filename=invoice_${itemId}.pdf`);

        const pdfStream = fs.createReadStream(`Sales Report.pdf`);
        pdfStream.pipe(res);

  } catch (error) {
    console.log(error);
  }
}


const getAdmin = async (req, res)=>{
  //console.log("Admin");
  try {
    if(req.session.admin){
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
    console.log("Blocked:" +userId);
    await User.findByIdAndUpdate(userId, {status: "Blocked"})
    res.redirect("/admin/adminPanel/customer");


  } catch (error) {
    console.log(error);
  }
}

const unblockUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log("Unblocked:" +userId);
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

// ***********************   BANNER MANAGEMENT   ************************
const getBanner = async(req, res)=>{
  console.log("------------------------------------------  BANNER LIST  ------------------");
  const bannerImg = await Banner.find()
  console.log(bannerImg);
  res.render("banners" ,  {title:`Luxicart-Banner List` , bannerImg})
}

const uploadBannerImg = async(req,res)=>{
  console.log("--------------------------   Uploading ----------");
  try {
    const { IMG } = req.file
    console.log("IMG" , req.file);
    let bannerData = await Banner.find();
    console.log(bannerData);
     bannerData = new Banner({
      image : req.file.filename
     })
     const newBaner = await bannerData.save()
     if(newBaner){
      res.redirect("/admin/adminPanel/banner")
     }

   
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};





module.exports = {
  getAdmin,
  verifyAdmin,
  getAdminPanel,
  adminLogout,
  loadCustomers,
  blockUser,
  unblockUser,
  orderMngmnt,

  salesPdfReport,

  getBanner,
  uploadBannerImg


  


}