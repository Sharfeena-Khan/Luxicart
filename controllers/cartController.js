const { Cart, WishList } = require("../models/cartModel");
const Product = require("../models/productModel");
const { User, UserAddress } = require("../models/userModels");
const Coupon = require("../models/coupon");

const mongoose = require("mongoose");

const { body, validationResult } = require("express-validator");

const flash = require("express-flash");

const { Payment, Order } = require("../models/orderModel");

const dotenv = require("dotenv");

dotenv.config();

const getCart = async (req, res)=>{
  try {
    console.log("===========================    CART PAGE   ========================");
    const userId = req.session.user_id
    const userData = await User.findById(userId)
    const userAddresses = await UserAddress.findOne({user_id: userId})
    const cartData = await Cart.findOne({user_id: userId})

    const totalPrice = cartData ? calculateTotalWithDelivery(cartData.total, 40) : 0;
    const currentDate = new Date();
    let availableCoupon = []
        availableCoupon = await Coupon.find({
          expireDate: { $gte: currentDate },
        })

    console.log(cartData);
    if(!cartData){
      req.flash('error', 'Nothing is added to cart')
      res.render('cart',  {
        title: `Luxicart-Cart-No items`,        
        userAuthenticated: userData,
        cartData,
        totalPrice:0,
        
        userAddresses,
        error: req.flash("error"),
        couponData:null,
        availableCoupon })

    } else{
      res.render("cart", {
        title: `Luxicart-Cart`,
        userAuthenticated: userData,
        cartData,
        totalPrice ,
       
        userAddresses,
        error: req.flash("error"),
        couponData: null,
        availableCoupon,
        
      });

    }
  } catch (error) {
    console.log(error);
  }



}

const calculateTotalWithDelivery= (total, extraCahrge)=>{
  return total+ extraCahrge
}



// ------------------------------  ADD TO CART   ------------------------------
const addtoCart = async(req, res)=>{
  try {
    console.log("------------------------------------  Add to Cart Button Clicked    ----------------------");
    console.log(req.body);
    const pdt_Id = req.params.id;
    const userId = req.session.user_id
    let offerPrice = 0
    console.log("add to cart", pdt_Id);

    
    // checking for offer Price
    let productData = await Product.findById(pdt_Id)
    if(productData.discountPercentage!==0){
      offerPrice = productData.price-(productData.price*(productData.discountPercentage/100))
      offerPrice = Math.round(offerPrice)
    }else{
      offerPrice = productData.price
    }

    //  // checking for prdt in userCart
    let userData = await User.findById(userId)
    const prdtInCart = userData.cart.some(
      (item) => item.product_id.toString() == pdt_Id
    );
    let currentStock = productData.stock
    currentStock = currentStock - req.body.qty;
    if (!prdtInCart) {
      userData.cart.push({
        product_id: pdt_Id,
        name: productData.name,
        price: offerPrice,
        image: productData.image,
        size: req.body.size,
        quantity: req.body.qty,
        stock: currentStock,
      });
      await userData.save();
    }
    
    // Adding items to Cart DB 
    let cartData = await Cart.findOne({user_id:userId})
    if (!cartData) {
      // If no cart exists, create a new one
      cartData = new Cart({
        user_id: req.session.user_id,
        total: 0,
        totalCount : 0,
        products: [],

      });
    }
    let totalPrice = cartData.total +(offerPrice*req.body.qty)
    let totalQty = cartData.totalCount + (1*req.body.qty)
    // checking for existance of item in Cart
    const existingProductIndex = cartData.products.findIndex(
      (product)=> product.product_id == pdt_Id && product.size == req.body.size )

      if(existingProductIndex !==-1){
        console.log("updating Same", cartData);
        cartData.products[existingProductIndex].quantity +=(req.body.qty * 1)
        cartData.totalCount = cartData.totalCount + (req.body.qty * 1)
        cartData.total =cartData.total +(offerPrice*req.body.qty)
        console.log(" after cart", cartData);
      }else {            // update new Cart
        cartData.total = totalPrice
        cartData.totalCount = totalQty
        cartData.products.push({
        product_id: pdt_Id,
        name: productData.name,
        price: offerPrice,
        image: productData.image,
        size: req.body.size,
        quantity: req.body.qty,
        stock: currentStock,
        })
      }
        const updatedCart = await cartData.save()
        if(updatedCart){
          let stock = productData.stock
              stock = stock - req.body.qty
              productData = await Product.findByIdAndUpdate(
                pdt_Id,
                {
                  $set : { stock : stock},                  
                },
                {new : true}
              )
              res.redirect("/cart");

        
        

      }
    
  } catch (error) {
    console.log(error);
  }

}

//  -------------------------------  DELETE CART  ----------------------
const delItem = async (req, res) => {
  console.log("delete");
  try {
      console.log("------------------     Cart  Removing  ------------");
      const { ObjectId } = require('mongoose').Types;
      let id = req.params.id;
      console.log("id from client side:  ",id);
      id = new ObjectId(id)
      console.log(id);
      const cartData = await Cart.findOne({user_id : req.session.user_id})

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
      if(updatedProduct.discountPercentage!==0){
        offerPrice = updatedProduct.price-(updatedProduct.price*(updatedProduct.discountPercentage/100))
        offerPrice = Math.round(offerPrice)
      }else{
        offerPrice = updatedProduct.price
      }
 
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

let delPrice = cartData.total - (cartQty*offerPrice)
let delCount = cartData.totalCount - cartQty
        
if(result){
  await Cart.findOneAndUpdate(
    {user_id : req.session.user_id},
    { $set : {
      totalCount : delCount,
      total :delPrice
    }}
  )
  
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


//  ------------------------------  ADDRESS   ----------------------
const getAddressPage =async(req, res)=>{
  try {
    console.log("Reached Address Page");

    const userId = req.session.user_id;
    const userAuthenticated = await User.findById(userId);

    const userAddresses = await UserAddress.findOne({ user_id: userId });
    const cartData = await Cart.findOne({ user_id: userId });
    console.log(cartData);
    const totalPrice = cartData ? calculateTotalWithDelivery(cartData.total, 40) : 0;
    console.log(totalPrice);

    res.render("address", {
      title: `Luxicart-Address`,
      userAuthenticated,
      cartData,
      totalPrice,
      
      userAddresses,
    });
  } catch (error) {
    console.log(error);
  }
  

}

// ****  SAVE ADRS***
const saveAdrs = async(req, res)=>{
  const userAuthenticated = req.session.user;
  try {
    const {
      name,
      zip,
      locality,
      Address,
      place,
      state,
      Lmark,
      altNum,
      Radios,
    } = req.body;

    const trimmedName = name.trim();
    const trimmedZip = zip.trim();
    const trimmedLocality = locality.trim();
    const trimmedAddress = Address.trim();
    const trimmedPlace = place.trim();
    const trimmedState = state.trim();
    const trimmedLmark = Lmark.trim();
    const trimmedAltNum = altNum.trim();

    body("name", "Name is required").notEmpty();

    body("zip", "Zip code is required").notEmpty();

    body("zip", "Invalid zip code").matches(/^\d{5}$/); // Check if zip is a 5-digit number

    body("locality", "Locality is required").notEmpty();

    body("Address", "Address is required").notEmpty();

    body("place", "City is required").notEmpty();

    body("state", "State is required").notEmpty();

    body("Lmark", "Landmark is required").notEmpty();

    body("altNum", "Alternate phone number is required").notEmpty().isNumeric();

    body("Radios", "Address type is required").notEmpty();

    if (
      !trimmedName.replace(/\s/g, "").length ||
      !trimmedZip.replace(/\s/g, "").length ||
      !trimmedLocality.replace(/\s/g, "").length ||
      !trimmedAddress.replace(/\s/g, "").length ||
      !trimmedPlace.replace(/\s/g, "").length ||
      !trimmedState.replace(/\s/g, "").length ||
      !trimmedLmark.replace(/\s/g, "").length ||
      !trimmedAltNum.replace(/\s/g, "").length
    ) {
      req.flash(
        "error",
        "Please provide valid values for all required fields."
      );
      return res.redirect("/cart");
    }

    // Check for validation errors

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // If there are validation errors, render the cart page with the errors
      req.flash(
        "error",
        errors.array().map((error) => error.msg)
      );
      return res.redirect("/cart");
    }

    const userAuthenticated = req.session.user;
    const userId = req.session.user_id;
    let userAdrs = await UserAddress.findOne({ user_id: userId });
    if (!userAdrs) {
      userAdrs = new UserAddress({
        user_id: userId,
        Addresses: [],
      });
    }
    // const user = await User.findById(userId)
    const newAdrs = {
      name: name,
      pincode: zip,
      locality: locality,
      Adrs: Address,
      city: place,
      state: state,
      landmark: Lmark,
      phoneNum: altNum,
      adrs_type: Radios,
    };
    if (
      !newAdrs.name ||
      !newAdrs.pincode ||
      !newAdrs.locality ||
      !newAdrs.Adrs ||
      !newAdrs.city ||
      !newAdrs.state
    ) {
      req.flash("error", "Please provide values for all required fields.");
      return res.redirect("/cart");
    }
    userAdrs.Addresses.push(newAdrs);
    const userAddresses = await userAdrs.save();

    if (userAddresses) {
      let user = await User.findOne({ _id: userId });
      let adrs = {
        name: trimmedName,
        adrsId: userAddresses.adrs_id,
        adrs: trimmedAddress,
        pincode: trimmedZip,
        locality: trimmedLocality,
        city: trimmedPlace,
        state: trimmedState,
        landmark: trimmedLmark,
        phoneNum: trimmedAltNum,
        adrs_type: Radios,
        mainAdrs: userAddresses.mainAdrs,
      };
      user.Addresses.push(adrs);
      await user.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
  }

}

// *** UPDATE MAIN ADRS  ***
const updateMainAddress = async(req, res)=>{
  const { addressId } = req.params;

  try {
    const userId = req.session.user_id;

    // Find the user's current main address
    const currentMainAddress = await UserAddress.findOne({
      user_id: userId,
      "Addresses.mainAdrs": true,
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
      { "Addresses._id": addressId },
      { $set: { "Addresses.$.mainAdrs": true } }
    );

    // Update the main address in the User collection
    await User.findOneAndUpdate(
      { _id: userId, "Addresses.adrsId": addressId },
      { $set: { "Addresses.$.mainAdrs": true } }
    );

    res.redirect("/cart/address");
  } catch (error) {
    console.log(error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }

}


//   -----------------------------  CHANGE QUANTITY  -------------------------
const changeQty = async(req, res)=>{
  try {
    const { productID, quantity, buttonValue } = req.body;
    console.log(
      "---------------------------------  chng qty  -----------------------"
    );
    let userCart = await Cart.findOne({user_id:req.session.user_id})
    console.log("data: ", req.body);
    let cart = await Cart.findOne({user_id:req.session.user_id, "products.product_id": productID });
    console.log("----------------- Before cart  -----------------", cart);
      let cartTotalItem = cart.totalCount
      let cartTotalItemPrice = cart.total
    if (cart) {
      const productIndex = cart.products.findIndex(
        (product) => product.product_id.toString() === productID
      );
      console.log("Product Index------------------->  ", productIndex);
      let productDetails = await Product.findOne({ _id: productID });

      console.log(
        "***************  Before product DB   ***************** /n",
        productDetails
      );
      let currentStock = productDetails.stock;
      if (productIndex !== -1) {
        console.log(
          "*---------------------------  stock updating   -------------------  "
        );
        let updatedProductDb;
        let updatedCart;

        if (buttonValue == -1) {
          // cart qty decreasing

          if (quantity < 1) {
            res.json({ success: false, error: "Quantity should be atlest 1" });
          } else {
            console.log("-----------------  cart qty decresing   ----------- ");
            currentStock = currentStock + 1;
            updatedProductDb = await Product.findOneAndUpdate(
              { _id: productID },
              { $set: { stock: currentStock } },
              { new: true }
            );
            if(updatedProductDb.discountPercentage!==0){
              offerPrice = updatedProductDb.price-(updatedProductDb.price*(updatedProductDb.discountPercentage/100))
              offerPrice = Math.round(offerPrice)
            }else{
              offerPrice = updatedProductDb.price
            }
            updatedCart = await Cart.updateOne(
              { "products.product_id": productID },
              {
                $set: {
                  "products.$.quantity": parseInt(quantity),
                  "products.$.stock": currentStock,
                },
              }
            );
              cartTotalItem = cartTotalItem-1
              cartTotalItemPrice = cartTotalItemPrice -offerPrice
              userCart= await Cart.findOneAndUpdate(
                {user_id : req.session.user_id},
                {$set : {
                  totalCount :cartTotalItem,
                  total : cartTotalItemPrice
                 }},
                 {new : true}
              )

            if (updatedCart.nModified === 0) {
              // Handle the case where the cart was not found or the quantity wasn't updated
              return res
                .status(404)
                .json({
                  success: false,
                  error: "Cart not found or quantity not updated",
                });
            }
          }
        } else {
          //cart qty Incresing
          if (productDetails.stock <= 0) {
            console.log("--------------------   out of stock   ------------");
            req.flash("warning", "Quantity exceeds available stock");
            // return res.redirect("/cart");
            res.json({
              success: false,
              error: "Quantity exceeds available stock",
            });
          } else {
            console.log("-----------------  cart qty Incresing   ----------- ");
            currentStock = currentStock - 1;
            updatedProductDb = await Product.findOneAndUpdate(
              { _id: productID },
              { $set: { stock: currentStock } },
              { new: true }
            );
            if(updatedProductDb.discountPercentage!==0){
              offerPrice = updatedProductDb.price-(updatedProductDb.price*(updatedProductDb.discountPercentage/100))
              offerPrice = Math.round(offerPrice)
            }else{
              offerPrice = updatedProductDb.price
            }

            updatedCart = await Cart.updateOne(
              { "products.product_id": productID },
              {
                $set: {
                  "products.$.quantity": parseInt(quantity),
                  "products.$.stock": currentStock,
                },
              }
            );
            cartTotalItem = cartTotalItem+1
            cartTotalItemPrice = cartTotalItemPrice+offerPrice
           userCart= await Cart.findOneAndUpdate(
              {user_id : req.session.user_id},
              {$set : {
                totalCount :cartTotalItem,
                total : cartTotalItemPrice
               }},
               {new : true}
            )

            if (updatedCart.nModified === 0) {
              // Handle the case where the cart was not found or the quantity wasn't updated
              return res
                .status(404)
                .json({
                  success: false,
                  error: "Cart not found or quantity not updated",
                });
            }
          }
        }
        console.log("prdt DB after", updatedProductDb);
        console.log(("cart after update", userCart));
        res.json({ success: true,  userCart});
      } else {
        req.flash("error", "Product not found in cart");
        res.redirect("/cart");
      }
    } else {
      req.flash("error", "Cart not found");
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error);
  }

}

// **********---------------------------******************* PAYMENT PAGE *********************

const getPaymentPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userAuthenticated = await User.findById(userId);
    const addressId = req.body.addressRadio;
    const user = await User.findById(userId);
    const userAddresses = await UserAddress.findOne({ user_id: userId });
    const cartData = await Cart.findOne({ user_id: userId });
    const totalPrice = cartData ? calculateTotalWithDelivery(cartData.total, 40) : 0;
    let mainAdrs = await UserAddress.findOne({
      user_id: userId,
      "Addresses.mainAdrs": true,
    });
    console.log("***********-----------------------*****************");
    console.log("money", cartData);

   
    console.log("payment page reached");
    res.render("paymentPage", {
      title: `Luxicart-Payment`,
      userAuthenticated,
      cartData,
      totalPrice,
      
      userAddresses,
      user,
      
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    // Handle the error appropriately (e.g., send an error response or redirect to an error page)
    res.status(500).send("Internal Server Error");
  }

}


//  -----------------------------------------  ORDER PLACED  ------------------------
const orderPlaced = async (req, res) => {
  try {
    console.log("Adrs to payment page");
    res.redirect("/cart/payment");
  } catch (error) {
    console.log(error);
  }
};




// ******************************************   WISHLIST        **********************************

const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const user = await User.findById(userId);

    const updatedWishlist = await WishList.findOne({ user_id: userId });
    res.render("wishList", {
      title: `Luxicart-Wishlist`,
      userAuthenticated: user,
      updatedWishlist,
    });
  } catch (error) {
    console.log(error);
  }

}

// ** ADD WISH  **
const AddWish = async (req, res) => {
  try {
    console.log("adding to wishlist");
    const pdt_Id = req.params.id;
    const userAuthenticated = req.session.user;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    if (!user) {
      // Handle case where user is not found
      return res.status(404).send("User not found");
    }
    const product = await Product.findById(pdt_Id);
    if (!product) {
      // Handle case where product is not found
      return res.status(404).send("Product not found");
    }

    const isProductInWishlist = user.wishList.some(
      (item) => item.product_id.toString() === pdt_Id
    );

    if (isProductInWishlist) {
      return res.render("itemDisplay", {
        title: `Luxicart-${product.name}`,
        userAuthenticated: user,
        product,
        message: "Already Added",
      });
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

    let wishListData = await WishList.findOne({ user_id: userId }).populate(
      "products"
    );

    console.log("adding to wishlist");

    if (!wishListData) {
      console.log("new Db created");
      wishListData = new WishList({
        user_id: userId,
        products: [],
      });
    }

    const existingPdtIndex = wishListData.products.findIndex(
      (product) => product.product_id == pdt_Id
    );

    if (existingPdtIndex !== -1) {
      return res.render("itemDisplay", {
        title: `Luxicart-${product.name}`,
        userAuthenticated,
        product,
        wishListData,
        message: "Already Added",
      });
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
      return res.json({ success: true, updatedWishlist });
      // return res.redirect(`/itemDisplay/${product._id}`);
    }
  } catch (error) {
    console.log(error);
    // Handle the error appropriately (e.g., send an error response to the client)
    return res.status(500).send("Internal Server Error");
  }

}


// **  REMOVE WISH  **
const removeWish = async (req, res) => {
  try {
    console.log("------------------Removing------------");
    const { ObjectId } = require("mongoose").Types;
    let itemId = req.params;
    itemId = new ObjectId(itemId);
    const userId = req.session.user_id;
    let userData = await User.findOne({ "wishList.product_id": itemId });
    console.log("************* user Data ***********  ", userData);
    let wishDB = await WishList.findOne({ user_id: userId });
    console.log("************* Wishlist Data ***********  ", wishDB);
    if (userData) {
      userData = await User.findOneAndUpdate(
        { "wishList.product_id": itemId },
        { $pull: { wishList: { product_id: itemId } } },
        { new: true }
      );
    }
    console.log(
      "*-*-*-*-*-*-*/-*************/////////////////////--------------------       ",
      userData
    );
    if (wishDB) {
      wishDB = await WishList.findOneAndUpdate(
        { user_id: userId },
        {
          $pull: {
            products: {
              product_id: itemId,
            },
          },
        },
        { new: true }
      );
    }

    console.log("llllllllllllllllllllllllllllrrrrrrrrrrrrrrrrr");
    res.json({ success: true, wishDB });
  } catch (error) {
    console.log(error);
  }

}



// ------------------------------------------- =========  Coupon Apply ======= --------------

const applyCoupon = async (req, res) => {
  try {
    console.log("Coupon Apply");
    const selectedCoupons = req.body.selectedCouponCode;
    console.log("Received request with body:", req.body);
    console.log("Selected Coupons:", selectedCoupons);
    let discountPercentage;
    let allDiscountPercentages = [];
    const couponData = await Coupon.find({ code: { $in: selectedCoupons } });
    console.log("Coupon Data:", couponData);

    if (couponData.length > 0) {
      allDiscountPercentages = [];
      couponData.forEach((coupon) => {
        discountPercentage = coupon.Discount;
        allDiscountPercentages.push(discountPercentage);
        console.log("Discount Percentage:", allDiscountPercentages);
      });

      const cartData = await Cart.findOne({ user_id: req.session.user_id });
      const totalPrice = cartData.total;
      console.log("Total Price:", totalPrice);

      const discountedPrice = applyCouponDiscount(
        totalPrice,
        allDiscountPercentages
      );
      if (discountedPrice) {
        const cartNew = await Cart.findOneAndUpdate(
          { user_id: req.session.user_id },
          { $set: { total: discountedPrice } },
          { upsert: true, new: true }
        );
        console.log("Updated Cart:", cartNew);
      }

      console.log("Discounted Price:", discountedPrice);
      // res.status(200).json({success : true})      // Send a redirect response to the client
       res.redirect('/cart');
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
    const roundedAmount = Math.round(discountAmount)
    discountedPrice -= roundedAmount;
        
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

  applyCoupon,
};


