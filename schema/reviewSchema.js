const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: {
    type:String,
    required: true,
  },
  email:{
    type:String,
    required:true,
  },
  message: {
    type: String,
    required: true,
  },
  // Add more fields as needed
});


const reviewSchema = mongoose.model('REVIEW', schema);

module.exports = reviewSchema;
