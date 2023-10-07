//Product Schema
const mongoose=require('mongoose')
const { Schema } = mongoose;


const schema= new Schema({


    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    order_date: { 
        type: Date, 
        default: Date.now 
    },
    order_items :[
        {
          product_name:{
            type:String,
            required:false
          },
          price:{
            type:Number,
            required:true,
          },
          quantity:{
            type:Number,
            required:true,
          }
        }
    ],
    total_amount: {
        type: Number,
        required: true
    }


})



const orderSchema = mongoose.model('ORDER', schema);

module.exports = orderSchema;