const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")
const Joi = require("joi");



const adrsSchema = new mongoose.Schema({
    user_id :{
        type: ObjectId,
        
    },
   Addresses : [{
    adrs_id : {
        type : ObjectId,
       
    },
    name : {
        type : String,
        required : true
    },
    pincode : {
        type : Number,
        required : true
    },
    locality : {
        type : String,
        required : true
    },
    Adrs : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    state: {
        type : String,
        required : true
    },
    landmark : {
        type : String,
        
    },
    phoneNum : {
        type : Number,
       
    },
    adrs_type : {
        type:String,
        default : "Home"
    },
    mainAdrs : {
        type: Boolean,
        default:false,
        validate: {
            validator: async function () {
                if (this.isNew && this.mainAdrs) {
                    // If a new address is marked as mainAdrs, check that no other address has mainAdrs set to true
                    const existingMainAddress = await this.constructor.findOne({ 'Addresses.mainAdrs': true, user_id: this.user_id });
                    return !existingMainAddress;
                }
                return true;
            },
            message: 'Only one address can be marked as mainAdrs'
        }
    }
    
   }],
})



const userSchema = new mongoose.Schema({

    FirstName:{
        type:String,
        default:""
        
    },

    LastName:{
        type:String,
        default:""
        
    },
    gender:{
        type : String
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    image : [{
        type:String,
      
       
    }],

    password:{
        type:String,
        required:true   

    },
    phone: {
        type:Number
    },
    status:{
        type:String,
        default:"Active"
    },
    isVerified:{

        type:Boolean,
        required:true,
        default:false

    },
    otp: {
        type: String, // Store the OTP as a string
    },
    otpExpiration: {
        type: Date, // Store the OTP expiration time as a Date
    }
    ,
    isAdmin:{
        type:Boolean,
        default:false
    },
    Addresses : [{
        adrsId : {
            type : ObjectId,
            
        },
        name :{
            type : String
        },
        adrs : {
            type :String,
            
        },
        pincode :{
            type: Number,
            
        },
        locality:{
            type : String,
            
        } , 
        city : {
            type : String,
           

        },
        state : {
            type : String,
            
        },
         landmark : {
        type : String,
        
    },
    phoneNum : {
        type : Number,
       
    },
    adrs_type : {
        type:String,
        default : "Home"
    },
    mainAdrs : {
        type: Boolean,
        default:false
    }
        


    }],
    wallet: {
        type: Number,
        default: 0,
      },
    pswd_token :{ 
        token : {type : String},
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 3600,
        },
    }
   
} ,
    {  timestamps: true}
)




const UserAddress = mongoose.model("Address" , adrsSchema)
const User = mongoose.model("User", userSchema)

// const validate = (User) => {
//     const schema = Joi.object({
//         name: Joi.string().required(),
//         email: Joi.string().email().required(),
//         password: Joi.string().required(),
//     });
//     return schema.validate(User);
// };


module.exports = {
    UserAddress , User ,
}