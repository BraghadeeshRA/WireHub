// User Schema
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

const schema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  tokens:[
    {
        token: {
            type: String,
            required: true
        }
    }
  ],
  cart :[
    {
      name:{
        type:String,
        required:false
      },
      model_id:{
        type:Number,
      },
      core: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      weight: {
        type: String,
        required: true
      },
      avatar:{
        type:String,
        required:true
      },
      price:{
        type:Number,
        required:true,
      },
      discount: {
        type: Number,
        required: true
      },
      total_quantity:{
        type:Number,
        required:true,
      },
      curr_quantity:{
        type:Number,
      },
    }
  ],
  order_history :[
    {
      order_date: { 
        type: Date, 
        default: Date.now 
      },
      total_amount: {
        type: Number,
        required: true
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
    
    
    }
  ],
  total_amount:{
    type:Number,
  }
  

});

//Generating Token
schema.methods.generateAuthToken = async function(){
  try{
   let token = jwt.sign({_id:this._id}, process.env.SECRET_KEY);
   this.tokens = this.tokens.concat({token:token});
   await this.save();
   return token;
  }catch(err){
   console.log(err);
  }
  }

//Adding Cart items
schema.methods.addMessage = async function(name,model_id,type,category,avatar,price,discount,quantity){
  try{
      this.cart=this.cart.concat({name,model_id,type,category,avatar,price,discount,quantity});
      await this.save();
      return this.cart;
  }
  catch(err){
          console.log(err);
  }
}

const userSchema = mongoose.model('GOOGLEUSER', schema);

module.exports = userSchema;
