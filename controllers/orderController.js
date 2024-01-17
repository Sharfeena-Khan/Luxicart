const {Order} = require("../models/orderModel")
const { Cart } = require("../models/cartModel")
const Product = require("../models/productModel")
const { User, UserAddress} = require("../models/userModels")


const Razorpay = require('razorpay');

const dotenv = require("dotenv");
const { response } = require("../routes/OrderRouter");

dotenv.config()

const RazorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
  });




const userOrderList = async(req,res)=>{
    const userAuthenticated = req.session.user
    const userId = req.session.user_id;
    const orderData = await Order.findOne({ user_id: userId })
   // console.log(orderData);
    res.render("orderList" ,  {title : "Luxicart- Order List" , userAuthenticated, orderData})
}


// ------------------------ ORDER CONFORM PAGE -------------------------

const getConformed =async (req,res) =>{
    try {
      console.log("getting page conformed");
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;
        const addressId = req.body.addressRadio;
        const userAddresses = await UserAddress.findOne({ user_id: userId });
        
        res.render("orderConformed" , { title:`Luxicart-OrderConformed`, userAuthenticated,  userAddresses} )
    } catch (error) {
        console.log(error);
    }
}

const Payment = async (req, res) => {
 
  const total = req.body.total;
  try {
    const {radio,  } = req.body
    console.log("*********************************");
    console.log("Payment BLOCK");
    console.log(req.body);
    console.log("*********************************");
   
    const userId = req.session.user_id;
   
    const cart = await Cart.findOne({ user_id: userId });
    const adrs = await UserAddress.findOne({ user_id: userId, 'Addresses.mainAdrs': true });
   const currentAdrs =  adrs._id
    
    let orderData = await Order.findOne({ user_id: userId }).populate('items.productId');
    
    if (!orderData) {
      const mainAdrs = adrs.Addresses.find((address) => address.mainAdrs);
    
      orderData = new Order({
        user_id: userId,
        address: {
          _id: currentAdrs,
          name: mainAdrs.name,
          adrs: mainAdrs.Adrs,
          pincode: mainAdrs.pincode,
          landmark: mainAdrs.landmark,
          city: mainAdrs.city,
          state: mainAdrs.state,
          phoneNum: mainAdrs.phoneNum,
        },
        items: [], // You may need to map items from the cart to here.
      });
    } else if (orderData.address._id !== currentAdrs) {
      // Update the existing order's address
      const mainAdrs = adrs.Addresses.find((address) => address.mainAdrs);

      orderData.address = {
        _id: currentAdrs,
        name: mainAdrs.name,
        adrs: mainAdrs.Adrs,
        pincode: mainAdrs.pincode,
        landmark: mainAdrs.landmark,
        city: mainAdrs.city,
        state: mainAdrs.state,
        phoneNum: mainAdrs.phoneNum,
      };
    }
    console.log("      ");
    console.log("New Adrs Added cod :" );

    if (cart && cart.products.length > 0) {
      console.log("Adding to order Db");
      let deliveryDate = new Date();
      let orderPlacedDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate()+1 ); // Set deliveryDate to tomorrow

      for (const cartProduct of cart.products) {
        const product = await Product.findOne({ _id: cartProduct.product_id });

        let productStatus = "Order Confirmed";

        if (product.status !== "Canceled") {
          const currentDate = new Date();
          productStatus = deliveryDate <= currentDate ? "Delivered" : "Order Placed";
        }
       

        let newOrder = {
          productId: cartProduct.product_id,
          productName: product.name,
          price: product.price,
          category: product.category,
          img1: product.image,
          size: cartProduct.size,
          quantity: cartProduct.quantity,
          orderStatus: productStatus,
          deliveryDate :deliveryDate,
          paymentMode : radio,
          orderPlaced : orderPlacedDate
        };
        

        orderData.items.push(newOrder);

      }

      await orderData.save();
      // await Cart.findOneAndDelete({ _id: cart._id });
      // console.log("cart is deleted");

      
   if(radio=== 'COD'){
    await Cart.findOneAndDelete({ _id: cart._id });
      // console.log("cart is deleted");

    console.log("cod action");
    
    res.json({COD_success:true})
   } else if(radio === 'razorpay'){

    console.log("razorpay");
    const orderAmountInPaise = total * 100;
    let receiptId = orderData.id
        receiptId = 'order'+receiptId
    let options = {
      amount: orderAmountInPaise,
      currency: "INR",
      receipt: receiptId
    };
    console.log(receiptId);

    const razorpayOrder = await RazorpayInstance.orders.create(options);
    await Cart.findOneAndDelete({ _id: cart._id });
      // console.log("cart is deleted");
    //  console.log("razorpay Order Details : ", razorpayOrder);
    res.json({razorpayOrder})

   } else if(radio==="wallet"){
    console.log("Wallet Block");
      let userData = await User.findById(userId)
      let walletAmount = userData.wallet
      console.log("Wallet Block", walletAmount);
      if(walletAmount>=total){
        walletAmount = walletAmount-total
       userData= await User.findByIdAndUpdate(
          userId,
          {$set: {wallet :walletAmount}},
          {new : true}
        )
        await userData.save()
        console.log("************   After :   ",userData);
        await Cart.findOneAndDelete({ _id: cart._id });
      // console.log("cart is deleted");
        res.json({success:true})
        

      }else {
        console.log("Insufficient wallet balance");
          // Remove the newly created order
          if (orderData && orderData.items.length > 0) {
            const cartProductIds = cart.products.map((product) => product.product_id);

            // Use $pull to remove items that match the cartProductIds
            await Order.updateOne(
              { user_id: userId },
              { $pull: { items: { productId: { $in: cartProductIds } } } }
            );
            }
          res.json({ insufficientBalance: true });
        }
      
     

   }
       
        // Handle Cash On Delivery
        // res.redirect("/orderList/orderConformed");
        // res.render("orderConformed" , { title:`Luxicart-OrderConformed`, userAuthenticated, } )
      
    } else {
      res.status(404).send("No products in the cart");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


// const RazorOrder = async(req,res)=>{
//   console.log("Razorpay Action Block");
//   const total = req.body.total;
//   try {
//     const userId = req.session.user_id;
//     const cart = await Cart.findOne({ user_id: userId });
//     const adrs = await UserAddress.findOne({ user_id: userId, 'Addresses.mainAdrs': true });
//     const currentAdrs =  adrs._id
    
//     let orderData = await Order.findOne({ user_id: userId }).populate('items.productId');
    
//     if (!orderData) {
//       const mainAdrs = adrs.Addresses.find((address) => address.mainAdrs);
    
//       orderData = new Order({
//         user_id: userId,
//         address: {
//           _id: currentAdrs,
//           name: mainAdrs.name,
//           adrs: mainAdrs.Adrs,
//           pincode: mainAdrs.pincode,
//           landmark: mainAdrs.landmark,
//           city: mainAdrs.city,
//           state: mainAdrs.state,
//           phoneNum: mainAdrs.phoneNum,
//         },
//         items: [], // You may need to map items from the cart to here.
//       });
//     } else if (orderData.address._id !== currentAdrs) {
//       // Update the existing order's address
//       const mainAdrs = adrs.Addresses.find((address) => address.mainAdrs);

//       orderData.address = {
//         _id: currentAdrs,
//         name: mainAdrs.name,
//         adrs: mainAdrs.Adrs,
//         pincode: mainAdrs.pincode,
//         landmark: mainAdrs.landmark,
//         city: mainAdrs.city,
//         state: mainAdrs.state,
//         phoneNum: mainAdrs.phoneNum,
//       };
//     }
    
//     console.log("      ");
   
//     if (cart && cart.products.length > 0) {
//       console.log("Adding to order Db");
//       let deliveryDate = new Date();
//       deliveryDate.setDate(deliveryDate.getDate() ); // Set deliveryDate to tomorrow

//       for (const cartProduct of cart.products) {
//         const product = await Product.findOne({ _id: cartProduct.product_id });

//         let productStatus = "Order Confirmed";

//         if (product.status !== "Canceled") {
//           const currentDate = new Date();
//           productStatus = deliveryDate <= currentDate ? "Delivered" : "Out for Delivery";
//         }

//         // if(orderData.address)

//         let newOrder = {
//           productId: cartProduct.product_id,
//           productName: product.name,
//           price: product.price,
//           category: product.category,
//           img1: product.image,
//           size: cartProduct.size,
//           quantity: cartProduct.quantity,
//           orderStatus: productStatus,
//         };

//         orderData.items.push(newOrder);
//       }

//       await orderData.save();
//       await Cart.findOneAndDelete({ _id: cart._id });
//       console.log("cart is deleted");

  
//     console.log("razorpay");
//     const orderAmountInPaise = total * 100;

//     let options = {
//       amount: total*100,
//       currency: "INR",
//       // receipt: orderData.id
//     };


//     const razorpayOrder = await RazorpayInstance.orders.create(options);
        
//         // Include orderId in the response to the frontend
//         res.render("razorpay-checkout", {
//           key_id: process.env.RAZORPAY_ID_KEY,
//           amount: razorpayOrder.amount,
//           currency: razorpayOrder.currency,
//           orderId: razorpayOrder.id, // Include orderId
//         });
    
    
             
      
//     // Handle Cash On Delivery
//     // res.redirect("/orderList/orderConformed")
//     // res.render("orderConformed" , { title:`Luxicart-OrderConformed`, userAuthenticated, } )
//    }

    
//     else {
//       res.status(404).send("No products in the cart");
//    }

//   }
//   catch (error) {
//       console.log(error.message);
//   }
// }

const razorpayPaymentConfrm = async(req,res)=>{
  console.log("helloooo");
  res.json({success: true})
}



 



const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderData = await Order.findOne({ user_id: userId });
    const productId = req.params.id;
    
    // Check if orderData exists and has orders
    if (orderData  && orderData.items && orderData.items.length > 0 ) {
      // Find the index of the product in the items array
      // console.log(orderData);
      
      const productIndex = orderData.items.findIndex(item => item._id.toString() === productId);
 console.log("index: ",productIndex);
      if (productIndex !== -1) {
        // Update the status of the specific product
        orderData.items[productIndex].orderStatus = "Canceled";
        let itemPrice  = orderData.items[productIndex].price
    console.log("Amount ",itemPrice);

       
  
        // Save the updated order
        await orderData.save();

        if(orderData.items[productIndex].orderStatus==="Canceled"){
          
          let userData = await User.findById(  userId  )
          console.log("Before:", userData);
          let walletAmount = userData.wallet + itemPrice
          
          userData = await User.findByIdAndUpdate(
             userId,
            {$set : {wallet : walletAmount }},
            {new : true}
          )
          console.log("order Cancelled");
           console.log(userData);
           await userData.save()

          
          
          
        }
  
        res.redirect("/orderList");
      } else {
        console.log("Product not found in the order");
        res.status(404).send("Product not found in the order");
      }
    } else {
      console.log("No orders found for the user");
      res.status(404).send("No orders found for the user");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}


const returnOrder = async (req, res)=>{
  try {
    const productId = req.params.id;
    console.log("productId" , productId);
    const userId = req.session.user_id;
    const orderData = await Order.findOne({ user_id: userId });
    // console.log(orderData);
    if (orderData  && orderData.items && orderData.items.length > 0 ) {
      // Find the index of the product in the items array
      console.log(orderData);
      
      const productIndex = orderData.items.findIndex(item => item._id.toString() === productId);
 console.log(productIndex);
      if (productIndex !== -1) {
        // Update the status of the specific product
        orderData.items[productIndex].orderStatus = "Returned";
  
        // Save the updated order
        await orderData.save();
  
        res.redirect("/orderList");
      } else {
        console.log("Product not found in the order");
        res.status(404).send("Product not found in the order");
      }
    } else {
      console.log("No orders found for the user");
      res.status(404).send("No orders found for the user");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
  
};



  

  





module.exports = {
    userOrderList,
    getConformed,
    Payment,
    cancelOrder,
    returnOrder,

    // RazorOrder,
    razorpayPaymentConfrm
}