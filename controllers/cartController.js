const {  Cart, WishList } = require("../models/cartModel")
const Product = require("../models/productModel")
const { User , UserAddress } = require("../models/userModels")
const Coupon = require("../models/coupon")

const mongoose = require('mongoose');


const { body, validationResult } = require('express-validator');


const flash = require('express-flash');

const  { Payment, Order } = require("../models/orderModel")


const dotenv = require("dotenv")

dotenv.config()

const Razorpay = require('razorpay');
// const { default: products } = require("razorpay/dist/types/products");


const RazorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
  });


  const getCart = async (req, res) => {
    try {
        console.log("===========================    CART PAGE   ========================");
        const userAuthenticated = req.session.user;
        
        const userId = req.session.user_id; 
        const userData = await User.findById(userId)      
        const userAddresses = await UserAddress.findOne({ user_id: userId });
        const cartData = await Cart.findOne({ user_id: userId });

        const productIds = cartData.products.map(product => product.product_id);
        const productsInCart = await Product.find({ _id: { $in: productIds } }, 'stock');
        const productStockMap = new Map(productsInCart.map(product => [product._id.toString(), product.stock]));



        const totalPrice = cartData ? calculateTotalWithDelivery(cartData.products, 40) : 0;
        const currentDate = new Date();
        const couponData = await Coupon.find();
        // console.log("=============================   coupons ============" , couponData);
        let availableCoupon = [];

        if (couponData) {
            availableCoupon = await Coupon.find({ minAmount : {$lte : totalPrice}, expireDate : {$gte : currentDate } });
        }
        // console.log("---------------------------------------------------------------------------", availableCoupon);
      const newOne =  await Cart.findOneAndUpdate(
        {user_id : userId },
        {$set :{total : totalPrice}},
        {upsert : true, new : true}
       )
       console.log("*-*-*-*-*-*-*-*-*-*-*-*-*--*-*-*-*-*-*-*-*-*",  newOne);

        res.render("cart", { 
            title: `Luxicart-Cart`,  
            userAuthenticated: userData, 
            cartData, 
            totalPrice, 
            calculateTotalPrice, 
            calculateTotalItemsCount, 
            userAddresses, 
            error: req.flash('error'), 
            couponData, 
            availableCoupon,
            productStockMap
        });
    } catch (error) {
        console.log(error);
        res.redirect("/error");
    }
};


const calculateTotalItemsCount = (products) => {
   
    return products.reduce((totalCount, product) => {
        const count = product.count || 0;
      
        return totalCount + product.quantity + count
    }, 0);
};

const calculateTotalPrice = (products) => {
    return products.reduce((total, product) => {
        return total + product.price * product.quantity;
    }, 0);
};

const calculateTotalWithDelivery = (products, deliveryCharge) => {
    const totalItemsPrice = calculateTotalPrice(products);
    return totalItemsPrice + deliveryCharge;
};


  

const addtoCart = async (req, res) => {
    const total = req.body.total;
    const pdt_Id = req.params.id;
    const userAuthenticated = req.session.user;
    console.log("add to cart", pdt_Id);

    try {
        // Check if a cart already exists for the user
        let userData = await User.findById(req.session.user_id );

        if (!userData) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }

        let cart = await Cart.findOne({ user_id: req.session.user_id });

        let product = await Product.findById(pdt_Id);
        const prdtInCart = userData.cart.some(item => item.product_id.toString() == pdt_Id);
        let currentStock = product.stock
        console.log("current Stock before adding to cart " , currentStock);
            currentStock = currentStock - req.body.qty
            console.log("current Stock after adding to cart " , currentStock);

        if (!prdtInCart) {
            userData.cart.push({
                product_id: pdt_Id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: req.body.size,
                quantity: req.body.qty,
                stock :  currentStock
            });
            await userData.save();
        }

        if (!cart) {
            // If no cart exists, create a new one
            cart = new Cart({
                user_id: req.session.user_id,
                products: [],
            });
        }

        const existingProductIndex = cart.products.findIndex(
            (product) => product.product_id == pdt_Id && product.size == req.body.size
        );

        if (existingProductIndex !== -1) {
            // If the product is already in the cart, update the quantity
            console.log('Updating existing product quantity');
            cart.products[existingProductIndex].quantity += 1;
        } else {
            // If the product is not in the cart, add it
            console.log('Adding new product to the cart:');
            cart.products.push({
                product_id: pdt_Id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: req.body.size,
                quantity: req.body.qty,
                stock :  currentStock
               
            });
        }

        // Save the updated cart
        const updatedCart = await cart.save();

        if (updatedCart) {
            
            console.log("************************************************", product);
           let stock = product.stock
                stock = stock - req.body.qty,
                product = await Product.findByIdAndUpdate(pdt_Id,
                {$set : {stock : stock}},
                {new : true})
                
            console.log("---------------*-**********---------------    product  :" ,product);
            // res.json({success: true})

            res.redirect("/cart");
        }
    } catch (error) {
        console.log(error);
    }
};



const delItem = async (req, res) => {
    console.log("delete");
    try {
        console.log("------------------     Cart  Removing  ------------");
        const { ObjectId } = require('mongoose').Types;
        let id = req.params.id;
        console.log("id from client side:  ",id);
        id = new ObjectId(id)
        console.log(id);

        let userData = await User.findOne({'cart.product_id': id})
        console.log("------------------user befor ------------", userData);
        if(userData){
            userData = await User.findOneAndUpdate(
                { 'cart.product_id': id},
                { $pull : {cart:{  product_id: id}}},
                {new :true}
            )
        }
        console.log("------------------user after      ********************************************* ------------", userData);

       
        let updatedProduct = await Product.findOne({_id : id})
        let prdctStock = updatedProduct.stock
        console.log("product updated stock*******************" , prdctStock);
   
        const data = await Cart.findOne(
            { 'products.product_id': id },
            { 'products.$': 1 } // Projection to include only the matching product
          );
          
        // const data = await Cart.findOne({user_id : req.session.user_id})
         let cartQty = data.products[0].quantity
        

         prdctStock = prdctStock+cartQty
        console.log("====================    item:   ",prdctStock);
        const result = await Cart.updateOne(
                        { 'products.product_id': id },
                         { $pull: { products: { product_id: id } } }
                            );


if(result){
    
    console.log("====================    After Cart delet:   ", prdctStock);
      
        updatedProduct = await Product.findOneAndUpdate(
        {_id : id},
        {$set : {stock : prdctStock}},
        {new : true}
    )
    if(updatedProduct){
        console.log("-----------------------------------------========================    ", updatedProduct);
    }
    res.redirect("/cart")
}
   
       
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

  // ***************************************** ADDRESS ****************************

//   const saveAddress = async (req, res)=>{
//     const userAuthenticated = req.session.user
//     try {
//       const {name ,zip, locality, Address, place, state, Lmark, altNum ,Radios } = req.body
     

//       let address = await ADRS.findOne({user_id : req.session.user_id})
//       if(!address){
//         address = new ADRS({
//           user_id : req.session.user_id,
//           Addresses : [],
//         })
//       }

//       const existingAddress = address.Addresses.find((Address) => Address.name === name && Address.Adrs === Address) 
//       if(existingAddress){
//         console.log("existing address");
//       } 
//       else {
//         const address = await 
//       }



//      const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.redirect('/cart', { errors: errors.array() , userAuthenticated: req.session.user });
//     }
//      const existingAdrs = await ADRS.findOne({Address: Address})
//      if (existingAdrs) {
//       console.log("Existing");
//       return res.redirect('/cart', );
      
//     }


//     const adrs = new ADRS({
//       name : name,
//       pincode : zip,
//       locality : locality,
//       Address: Address,
//       city : place,
//       state : state,
//       landmark : Lmark,
//       phoneNum : altNum,
//       adrs_type : Radios

//     })
//     const adrsData = await adrs.save()
//     if(adrsData){
//       res.redirect("/cart")
//     }

      
//     } catch (error) {
//       console.log(error);
//     }
//   }


const saveAdrs = async(req, res,next)=>{
    const userAuthenticated = req.session.user
    try {
        const {name ,zip, locality, Address, place, state, Lmark, altNum ,Radios } = req.body
        
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
            return res.redirect('/cart');
        }



        // Check for validation errors

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // If there are validation errors, render the cart page with the errors
            req.flash('error', errors.array().map(error => error.msg));
            return res.redirect('/cart');
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
            return res.redirect('/cart');
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

      
        res.redirect("/cart")
        
    } catch (error) {
        console.log(error);
    }
}


// ----------------------------------       CHANGE QUANTITY     -----------------


// const changeQty = async (req, res) => {
//     // const newQuantity = parseInt(req.body.quantity, 10);
//     // const productId = req.body.productID;

//     try {

//        const { productID, quantity, buttonValue} = req.body
//        let newQty 

        
//         console.log("---------------------------------  chng qty  -----------------------");
//         // console.log("qty  :  ", newQuantity);
//         // console.log(" prd id", productId);
//         console.log("data: " ,req.body);
//         let cart = await Cart.findOne({ 'products.product_id': productID });
//         console.log("-----------------  cart  -----------------", cart);

//         if (cart) {
//             const productIndex = cart.products.findIndex(product => product.product_id.toString() === productID);
//             console.log("hell0ooooooooooooooooooo" , productIndex);
//             if (productIndex !== -1) {
//                 // Update the quantity of the specific product
//                 console.log("qnty on click" , quantity);
//                 cart.products[productIndex].quantity = quantity;
                
//                 cart =await cart.save();
//                 console.log("------------------new cart----------------" , cart);

                
//                 const productStock = await Product.findOne({_id : productID});
//                 console.log("***************   product DB   ***************** /n" , productStock);
//                 let currentStock = productStock.stock

//                 console.log("***************   new  Quantity   *****************" , quantity);
//                 if ( productStock.stock <=0 ) {
//                     // Handle exceeding stock limit
//                     console.log("iudhfdiuidjfif");
//                     req.flash('warning', 'Quantity exceeds available stock');
//                     return res.redirect("/cart");
//                 } else{
//                     console.log("*---------------------------  stock updating   -------------------  ");
//                     let updatedProductDb
//                     if(buttonValue ==-1){
//                         // newQty = quantity + buttonValue
//                         currentStock = currentStock+1
//                          updatedProductDb= await Product.findOneAndUpdate(
//                             {_id : productID},
//                             {$set : {stock: currentStock} },
//                             {new :true}
//                         )

//                     }else{
//                         console.log("------------------",quantity);
//                         currentStock = currentStock-1
//                         // newQty = quantity + buttonValue
//                         console.log(newQty);
//                          updatedProductDb= await Product.findOneAndUpdate(
//                             {_id : productID},
//                             {$set : {stock: currentStock} },
//                             {new :true}
//                         )


//                     }
                   
//                     console.log(updatedProductDb);
//                     res.json({success:true})
//                 }

//                 // await cart.save();
//                 // res.redirect("/cart");
//             } else {
//                 req.flash('error', 'Product not found in cart');
//                 res.redirect("/cart");
//             }
//         } else {
//             req.flash('error', 'Cart not found');
//             res.redirect("/cart");
//         }
//     } catch (error) {
//         console.error(error);
//         req.flash('error', 'Internal Server Error');
//         res.redirect("/cart");
//     }
// };

const changeQty = async(req,res)=>{
    try {

        const { productID, quantity, buttonValue} = req.body
        console.log("---------------------------------  chng qty  -----------------------");
        console.log("data: " ,req.body);
        let cart = await Cart.findOne({ 'products.product_id': productID });
        console.log("----------------- Before cart  -----------------", cart);

        if(cart){
            const productIndex = cart.products.findIndex(product => product.product_id.toString() === productID);
            console.log("Product Index------------------->  " , productIndex);
            let productDetails = await Product.findOne({_id : productID});
            console.log("***************  Before product DB   ***************** /n" , productDetails);
            let currentStock = productDetails.stock
            if (productIndex !== -1){
                 
                    console.log("*---------------------------  stock updating   -------------------  ");
                    let updatedProductDb
                    let updatedCart
                  
                    if(buttonValue==-1){ // cart qty decreasing

                        if(quantity <1){
                            res.json({success : false, error: 'Quantity should be atlest 1'})

                        }else{
                            console.log("-----------------  cart qty decresing   ----------- ");
                        currentStock = currentStock+1
                        updatedProductDb= await Product.findOneAndUpdate(
                            {_id : productID},
                            {$set : {stock: currentStock} },
                            {new :true}
                        )
                         updatedCart = await Cart.updateOne(
                            { 'products.product_id': productID },
                            { $set: { 'products.$.quantity': parseInt(quantity),
                            'products.$.stock': currentStock
                         }}
                        );
                    
                        if (updatedCart.nModified === 0) {
                            // Handle the case where the cart was not found or the quantity wasn't updated
                            return res.status(404).json({ success: false, error: 'Cart not found or quantity not updated' });
                        }

                        }

                        


                       


                    } else { //cart qty Incresing
                        if(productDetails.stock <=0){
                            console.log("--------------------   out of stock   ------------");
                            req.flash('warning', 'Quantity exceeds available stock');
                            // return res.redirect("/cart");
                            res.json({success : false, error: 'Quantity exceeds available stock'})
                        }else{
                            console.log("-----------------  cart qty Incresing   ----------- ");
                        currentStock = currentStock-1
                        updatedProductDb= await Product.findOneAndUpdate(
                            {_id : productID},
                            {$set : {stock: currentStock} },
                            {new :true}
                        )
                        
                        updatedCart = await Cart.updateOne(
                            { 'products.product_id': productID },
                            { $set: { 
                                'products.$.quantity': parseInt(quantity),
                                'products.$.stock': currentStock
                             }}
                        );
                    
                        if (updatedCart.nModified === 0) {
                            // Handle the case where the cart was not found or the quantity wasn't updated
                            return res.status(404).json({ success: false, error: 'Cart not found or quantity not updated' });
                        }

                        }

                        
                        
                        

                        

                    }
                    console.log("prdt DB after", updatedProductDb);
                    console.log(("cart after update" , updatedCart));
                    res.json({success:true, cart})
                } else {
                req.flash('error', 'Product not found in cart');
                res.redirect("/cart");
            }
         

        } else {
            req.flash('error', 'Cart not found');
            res.redirect("/cart");
        }


        
    } catch (error) {
        console.log(error);
    }
}




const getAddressPage = async(req , res)=>{

    try {

        console.log("Reached Address Page");
       
        const userId = req.session.user_id;
        const userAuthenticated = await User.findById(userId)

        const userAddresses = await UserAddress.findOne({ user_id: userId });
        const cartData = await Cart.findOne({ user_id: userId });
        const totalPrice = cartData ? calculateTotalWithDelivery(cartData.products, 40) : 40;

        res.render("address" ,{title:`Luxicart-Address`,  userAuthenticated, cartData, totalPrice,calculateTotalPrice, calculateTotalItemsCount , userAddresses,  })

    } catch (error) {
        
    }
   }


  


   const updateMainAddress = async (req, res) => {
    const { addressId } = req.params;

    try {
        const userId = req.session.user_id;

        // Find the user's current main address
        const currentMainAddress = await UserAddress.findOne({
            user_id: userId,
            'Addresses.mainAdrs': true
        });

        // If there is a current main address, update it to false
        if (currentMainAddress) {
            currentMainAddress.Addresses.forEach(async (address) => {
                if (address.mainAdrs) {
                    address.mainAdrs = false;
                }
            });
            await currentMainAddress.save();
        }

        // Update the selected address to be the new main address
        await UserAddress.findOneAndUpdate(
            { 'Addresses._id': addressId },
            { $set: { 'Addresses.$.mainAdrs': true } }
        );

        // Update the main address in the User collection
        await User.findOneAndUpdate(
            { _id: userId, 'Addresses.adrsId': addressId },
            { $set: { 'Addresses.$.mainAdrs': true } }
        );

        res.redirect("/cart/address");
    } catch (error) {
        console.log(error);
        // Handle the error appropriately
        res.status(500).send("Internal Server Error");
    }
};






// **********---------------------------******************* PAYMENT PAGE *********************


const getPaymentPage = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        const userAuthenticated = await User.findById(userId)
        const addressId = req.body.addressRadio;
        const user = await User.findById(userId)
        const userAddresses = await UserAddress.findOne({ user_id: userId });
        const cartData = await Cart.findOne({ user_id: userId });
        const totalPrice = cartData ? calculateTotalWithDelivery(cartData.products, 40) : 40;
        let mainAdrs = await UserAddress.findOne({user_id : userId , 'Addresses.mainAdrs' : true})
        console.log("***********-----------------------*****************");
       console.log("money", cartData);

        // let options = {
        //     amount: totalPrice * 100,
        //     currency: "INR",
        // };
      
        // const razorpayOrder = await RazorpayInstance.orders.create(options);

        console.log("payment page reached" , );
        res.render("paymentPage", {
            title: `Luxicart-Payment`,
            userAuthenticated,
            cartData,
            totalPrice,
            calculateTotalPrice,
            calculateTotalItemsCount,
            userAddresses,
            user
            // razorpayOrder
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        // Handle the error appropriately (e.g., send an error response or redirect to an error page)
        res.status(500).send("Internal Server Error");
    }
}


const orderPlaced = async(req,res)=>{
    try {
        
        console.log("Adrs to payment page");
        res.redirect("/cart/payment")
        
    } catch (error) {
        
    }
}




// ***********************************************************************************************
// ******************************************   WISHLIST        **********************************

const getWishlist = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        
        const user = await User.findById(userId)

        
        const updatedWishlist = await WishList.findOne({user_id : userId})
        res.render("wishList", { title: `Luxicart-Wishlist`, userAuthenticated : user, updatedWishlist });
        
    } catch (error) {
        console.log(error);
    }
}

const AddWish = async (req, res) => {
    try {
        console.log("adding to wishlist");
        const pdt_Id = req.params.id;
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        if (!user) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }
        const product = await Product.findById(pdt_Id);
        if (!product) {
            // Handle case where product is not found
            return res.status(404).send('Product not found');
        }

        const isProductInWishlist = user.wishList.some(item => item.product_id.toString() === pdt_Id);

        if (isProductInWishlist) {
            return res.render("itemDisplay", { title: `Luxicart-${product.name}`, userAuthenticated: user, product, message: "Already Added" });
        } else {
            // Add the product to the user's wishlist
            user.wishList.push({
                product_id: pdt_Id,
                name: product.name,
                category: product.category,
                price: product.price,
                image: product.image,
            });

            // Save the user document with the updated wishlist
            await user.save();
        }


        let wishListData = await WishList.findOne({ user_id: userId }).populate("products");

        console.log("adding to wishlist");

        if (!wishListData) {
            console.log("new Db created");
            wishListData = new WishList({
                user_id: userId,
                products: []
            });
        }

        const existingPdtIndex = wishListData.products.findIndex((product) => product.product_id == pdt_Id);

        if (existingPdtIndex !== -1) {
            return res.render("itemDisplay", { title: `Luxicart-${product.name}`, userAuthenticated, product, wishListData, message: "Already Added" });
        } else {
            wishListData.products.push({
                product_id: pdt_Id,
                name: product.name,
                category: product.category,
                price: product.price,
                image: product.image,
            });
        }

        console.log("Adding items");

        const updatedWishlist = await wishListData.save();

        if (updatedWishlist) {
            return res.json({success : true, updatedWishlist})
            // return res.redirect(`/itemDisplay/${product._id}`);
        }

    } catch (error) {
        console.log(error);
        // Handle the error appropriately (e.g., send an error response to the client)
        return res.status(500).send('Internal Server Error');
    }
};



const removeWish = async(req, res)=>{
   try {
    console.log("------------------Removing------------");
    const { ObjectId } = require('mongoose').Types;
    let itemId = req.params
    itemId = new ObjectId(itemId); 
    const userId = req.session.user_id;
    let userData = await User.findOne({ "wishList.product_id": itemId })
    console.log("************* user Data ***********  ", userData);
    let wishDB =await WishList.findOne({user_id : userId})
    console.log("************* Wishlist Data ***********  ", wishDB);
    if(userData){
        userData = await User.findOneAndUpdate(
            { "wishList.product_id": itemId },
            {$pull : {wishList: {product_id: itemId}}},
            {new : true}
            )
    }
    console.log("*-*-*-*-*-*-*/-*************/////////////////////--------------------       ", userData);
    if(wishDB){
      wishDB =  await WishList.findOneAndUpdate(
            {user_id : userId},
            {$pull : {products : {
                product_id : itemId
            }}},
            {new : true}

        )
    }
   
    
            console.log("llllllllllllllllllllllllllllrrrrrrrrrrrrrrrrr");
            res.json({success:true, wishDB})

        
    
   } catch (error) {
    console.log(error);
    
   } 

}


// ------------------------------------------- =========  Coupon Apply ======= --------------


const applyCoupon = async (req, res) => {
    try {
        console.log("-------------------------------------------- =========  Coupon Apply ======= -----------------------------");
        const selectedCoupons = req.body.coupons;
        // console.log("Received request with body:", req.body);
        // console.log("Selected Coupons:", selectedCoupons);
        let discountPercentage
        let allDiscountPercentages = [];
        const couponData = await Coupon.find({ code: { $in: selectedCoupons } });

        // Check if any coupons were found
        if (couponData.length > 0) {
            allDiscountPercentages = [];
          // Iterate through each coupon in the array
          couponData.forEach((coupon) => {
             discountPercentage = coupon.Discount;
             allDiscountPercentages.push(discountPercentage);
            // Now you can use the discountPercentage variable for each coupon
            console.log("------------------------             percentage : ", allDiscountPercentages);
          });
        

        
            const cartData = await Cart.findOne({ user_id: req.session.user_id });
            // const totalPrice = cartData ? calculateTotalPrice(cartData.products) : 0;
            const totalPrice = cartData.total
            console.log(totalPrice,"******************************************************************");

            // Apply the coupon discount to the total price
            const discountedPrice = applyCouponDiscount(totalPrice, allDiscountPercentages);
            if(discountedPrice){
               const cartNew= await Cart.findOneAndUpdate(
                    {user_id : req.session.user_id},
                    {$set : {total : discountedPrice}},
                    {upsert : true, new : true}
                )
                console.log(".....................................",cartNew);
            }

            console.log("Discounted Price:", discountedPrice);

            res.json({ success: true, message: "Coupon applied successfully!" });
        } else {
            res.json({ success: false, message: "Invalid or expired coupon code!" });
        }

    

       
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Function to apply the coupon discount
function applyCouponDiscount(totalPrice, discountPercentages) {
    let discountedPrice = totalPrice;
  
    // Apply each discount percentage to the total price
    discountPercentages.forEach((discountPercentage) => {
      const discountAmount = (discountPercentage / 100) * discountedPrice;
      discountedPrice -= discountAmount;
    });
  
    return discountedPrice;
  }
  



  module.exports = {
    getCart,
    addtoCart,
    delItem, 

    changeQty,

    saveAdrs,
    getAddressPage,
    updateMainAddress,

    getPaymentPage,
    orderPlaced,

    getWishlist,
    AddWish,
    removeWish,

    applyCoupon
    

   
  }