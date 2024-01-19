const {  Cart, WishList } = require("../models/cartModel")
const Product = require("../models/productModel")
const { User , UserAddress } = require("../models/userModels")


const mongoose = require('mongoose');


const { body, validationResult } = require('express-validator');


const flash = require('express-flash');

const  { Payment, Order } = require("../models/orderModel")


const dotenv = require("dotenv")

dotenv.config()

const Razorpay = require('razorpay');


const RazorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
  });


const getCart = async (req, res) => {
    try {
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;

       

        const userAddresses = await UserAddress.findOne({ user_id: userId });
        // console.log("address : ", userAddresses);
        // Use findOne instead of findById to handle null case
        const cartData = await Cart.findOne({ user_id: userId });
        const totalPrice = cartData ? calculateTotalWithDelivery(cartData.products, 40) : 40;

        res.render("cart", { title:`Luxicart-Cart`,  userAuthenticated, cartData, totalPrice,calculateTotalPrice, calculateTotalItemsCount , userAddresses, error: req.flash('error') });
    } catch (error) {
        console.log(error);
        // Flash an error message or handle the error appropriately
        res.redirect("/error"); // Redirect to an error page or handle as needed
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
    const total = req.body.total
   
    const pdt_Id = req.params.id;
    const userAuthenticated = req.session.user;
    console.log("add to cart", pdt_Id);

    try {
        // Check if a cart already exists for the user
        let cart = await Cart.findOne({ user_id: req.session.user_id });

        if (!cart) {
            // If no cart exists, create a new one
            cart = new Cart({
                user_id: req.session.user_id,
                products: [],
            });
        }

        const existingProductIndex = cart.products.findIndex((product) => product.product_id == pdt_Id && product.size == req.body.size);

// console.log('existingProductIndex:', existingProductIndex);

if (existingProductIndex !== -1) {
    // If the product is already in the cart, update the quantity
    console.log('Updating existing product quantity');
    cart.products[existingProductIndex].quantity += 1;
} else {
    // If the product is not in the cart, add it
    const product = await Product.findById(pdt_Id);
    console.log('Adding new product to the cart:');
    // cart.Total_Amount = req.body.total
    cart.products.push({
        product_id: pdt_Id,
        name: product.name, 
        price: product.price,
        image: product.image,
        size: req.body.size,
        quantity: req.body.qty,
        stock: product.stock
    });
}

// Save the updated cart
const updatedCart = await cart.save();
// console.log('Updated Cart:', updatedCart);

        // -------------------------------------------------------

        if (updatedCart) {
            const id = updatedCart.products.product_id
            const pdt =await Product.findOne(id)
            // console.log("product  :" ,pdt);
           
                res.redirect("/cart");
          
        }
        
        

      
    } catch (error) {
        console.log(error);
    }
};



const delItem = async (req, res) => {
    console.log("delete");
    try {
        const id = req.params.id;
        console.log(id);
        const data = await Cart.findOne(
            { 'products._id': id },
            { 'products.$': 1 } // Projection to include only the matching product
          );
         
        console.log("item:", data);
        const result = await Cart.updateOne(
  { 'products._id': id },
  { $pull: { products: { _id: id } } }
);
if(result){
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

const changeQty = async (req, res) => {
    const itemQty = req.body.quantity;
    const id = req.body.productID;
    const count = req.body.count;
   // const stock = req.body.stock
//    const objectId =  mongoose.Types.ObjectId.createFromHexString(id);

    console.log(itemQty, "id : ", id, "stock:" );

    try {
        const cart = await Cart.findOne({ 'products._id': id  });
        // const stock = await cart.products({ 'products._id': id  },{stock:1})
        let itemStock = await Product.findById(id)
        console.log(itemStock);
        if (cart) {
            // console.log("hai" , stock);
            console.log("Cart found:", cart);

            const productIndex = cart.products.findIndex(product => product._id.toString() === id);

            if (productIndex !== -1) {

                
              
                // Update the quantity of the specific product
                cart.products[productIndex].quantity = req.body.quantity;
                await cart.save();
                res.redirect("/cart");
            }
        } else {
            res.status(404).send("Product not found in cart");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




const getAddressPage = async(req , res)=>{

    try {

        console.log("Reached Address Page");
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;

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
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;
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
        const userAuthenticated = req.session.user;
        const userId = req.session.user_id;
        const updatedWishlist = await WishList.findOne({user_id : userId})
        res.render("wishList", { title: `Luxicart-Wishlist`, userAuthenticated, updatedWishlist });
        
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
        const product = await Product.findById(pdt_Id);

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
            return res.json({success : true})
            // return res.redirect(`/itemDisplay/${product._id}`);
        }

    } catch (error) {
        console.log(error);
        // Handle the error appropriately (e.g., send an error response to the client)
        return res.status(500).send('Internal Server Error');
    }
};

const removeWish =async(req,res)=>{
    const { ObjectId } = require('mongoose').Types;
    try {
console.log("------------------Removing------------");
        let itemId = req.params
        console.log("---------*-*-*-*-*-*-*-*-*-*", itemId);
        itemId = new ObjectId(itemId); 
        const userId = req.session.user_id;
        console.log(itemId);

        const wishData = await WishList.findOne({user_id: userId})
        console.log(wishData);
        if(wishData){
            await WishList.updateOne(
            {user_id : userId},
            {$pull : {products :{ product_id : itemId}}}

            )
           res.json(wishData)

           }
        
        
    } catch (error) {
        console.log(error);
    }
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
    removeWish

    

   
  }