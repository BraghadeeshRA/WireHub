//  --------------------        SETUP         ---------------------------

const express = require("express");
const router = express.Router();

const passport = require("passport");
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const authenticate = require('../middleware/authenticate')
//DB
require('../db/dbconn')

//Schema
const productSchema = require('../schema/productSchema');
const userSchema = require("../schema/userSchema");
const orderSchema = require("../schema/orderSchema");
const reviewSchema = require('../schema/reviewSchema');


// ---------------------   GOOGLE OAUTH 2     ---------------------------

//signup - strategy
router.get("/auth/google/signup", passport.authenticate("google", ["profile", "email"]));

router.get(
	"/auth/google/signup/callback",
	passport.authenticate("google",{session: false}),
	(req,res) => {
		// successRedirect: process.env.CLIENT_URL,
		// failureRedirect: "/signup/failed",
		res.cookie("jwtoken", req.user.token, { path: '/' },{ expires:new Date(Date.now()+ 25892000),httpOnly: true });
		console.log("Cookie stored");
		console.log("========================");
    	res.redirect(process.env.CLIENT_URL);
	}
);


// ----------------------    ROUTES     ---------------------------------------



//This will return the user's detail to the user's page in client side
router.get("/getData",authenticate, (req,res) => 
{
    res.send(req.rootUser);
});  

//to get all data with images
router.get('/product/images', (req, res) => {
	productSchema.find()
	  .sort('-created')
	  .then((images) => {
		res.json(images);
	  }).catch((err) => {
		res.status(500).json({ success: false, error: err.message });
	  });
  });
	
// handle GET request for all Products
router.get('/products', async (req, res) => {
  try {
	const users = await productSchema.find();
	res.send(users);
  } catch (err) {
	res.status(500).send(err);
  }
});
  
// Get an product by ID (dynamic pages)
router.get('/api/dynamicproduct/:id', async (req, res) => {
 try {
 	const prodcut = await productSchema.findById(req.params.id);
	res.json(prodcut);
 } catch (err) {
	res.status(500).json({ error: 'Failed to fetch employee details' });
 }
}); 
  
// Clearance of cookies when Logout 
router.get("/logout1", (req,res) => 
{
	
	res.clearCookie('jwtoken', {path: '/'});
	res.status(200).send("User Logout");
});



// ------------------------    CART FUNCTIONALITY      ----------------------------


//ADD TO CART
router.post('/addtocart',authenticate, async (req, res) => {
	try {
	  const { name,core,model_id,type,weight,avatar,price,discount,quantity} = req.body;
	  const user=await userSchema.findOne({_id:req.userID});
	  // Check if the product is already in the user's cart
	  const productInCart = user.cart.find((item) => item.name === name);
	  if (productInCart) {
		console.log(`Product "${name}" already exists in cart`);
		return res.status(422).json({ error: 'Product already added to the cart' });
	  }
	  // Add the new item to the user's cart
	  user.cart.push({ name,core,model_id,type,weight,avatar,price,discount,total_quantity:quantity});
	  // Save the user document with the updated cart
	  await user.save();
	  res.json({ message: 'Item added to the cart' });
	  console.log(`the product "${name}" is added successfully to the cart of "${user.displayName}"`);
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ message: 'Server error' });
	}
});
    
// handle GET request for all Products in the cart
router.get('/cartitems', authenticate, async (req, res) => {
	const user=await userSchema.findOne({_id:req.userID});
	const items = user.cart;
	res.send(items);
});
  
// Delete items in cart
router.delete('/cartitems/:id', authenticate, async (req, res) => {
	const userId = req.userID;
	const itemIdToDelete = req.params.id;
	try {
	  // Find the user by their ID
	  const user = await userSchema.findById(userId);
	  if (!user) {
		return res.status(404).json({ message: 'User not found' });
	  }
	  // Use Mongoose's pull method to remove the item from the cart array
	  user.cart.pull(itemIdToDelete);
	  // Save the updated user
	  await user.save();
	  res.json({ message: 'Item removed from the cart successfully' });
	  console.log(`the product is deleted successfully from the cart of "${user.displayName}"`);
	}catch (error) {
	  console.error(error);
	  res.status(500).json({ message: 'Server error' });
	}
});

// ----------------------------------------------------------------------  order history ------------------------------------------------------------------------------------------


// handle GET request for all Products in the cart
router.get('/orderitems', authenticate, async (req, res) => {
	try {
	  const user = await userSchema.findOne({ _id: req.userID });
	  if (!user) {
		return res.status(404).json({ message: 'User not found' });
	  }
  
	  const orderHistory = user.order_history; // Assuming it's 'order_history' in your schema
	  res.json({ orderHistory }); // Sending 'orderHistory' in an object
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ message: 'Server error' });
	}
  });


// ----------------------------------------------------------------------  CHECKOUT ------------------------------------------------------------------------------------------



  


// Create a route to update the cart
router.post('/updateCart', authenticate, async (req, res) => {
	try {
	  // Extract the cart data from the request body
	  const { cart , total} = req.body;
  
	  // Find the user by their ID using the authenticated user data
	  const user = req.rootUser;
  
	  // Update the curr_quantity for each item in the user's cart
	  cart.forEach((cartItem) => {
		const userCartItem = user.cart.find(
		  (item) => item.model_id === cartItem.model_id
		);
  
		if (userCartItem) {
		  userCartItem.curr_quantity = cartItem.cartquantity;
		}
	  });
	  user.total_amount = total;
	  // Save the user with the updated cart
	  await user.save();
	  console.log("cart updated");
	  res.status(200).json({ message: 'Cart updated successfully' });
	} catch (error) {
	  console.error('Error updating cart:', error);
	  res.status(500).json({ error: 'Internal server error' });
	}
  	});
  

  	// Create a route to decrement cart quantity
	router.post('/decrement', authenticate, async (req, res) => {
	try { 
	  // Find the user by authenticated user data
	 
	  const user = req.rootUser;
	  // Loop through each cart item and update product quantity
	  for (const cartItem of user.cart) {
		
		const product = await productSchema.findOne({ model_id: cartItem.model_id });
		if (!product) {
		  return res.status(404).json({ error: `Product not found for model_id: ${cartItem.model_id} `});
		}
		if (product.quantity >= cartItem.curr_quantity) {
		  product.quantity -= cartItem.curr_quantity;
		} else {
		  return res.status(400).json({ error: `Insufficient product quantity for model_id: ${cartItem.model_id}` });
		}  
		// Save the updated product data
		await product.save();
	  }
	  console.log("product quantities decremented");
	  res.status(200).json({ message: 'Quantities decremented successfully' });
	 } catch (error) {
	  console.error('Error decrementing quantities:', error);
	  res.status(500).json({ error: 'Internal server error' });
	 } 
    });


router.post('/checkout', authenticate, async (req, res) => {
	try {
	  const user = await userSchema.findOne({ _id: req.userID });
	  const { total_amount, phone, address, pincode, state, country } = req.body;
	  if ( !total_amount || !phone || !address || !pincode || !state || !country ){
		console.log("please fill the field properly");
		return res.status(404).json({ error: "Fill the field properly"});
	  }
  
	  const orderItems = [];
      // Iterate through the items in the user's cart
	  for (const cartItem of user.cart) {
		// Map cart item data to order item fields
		const orderItem = {
		  product_name: cartItem.name,
		  model_id: cartItem.model_id,
		  price: cartItem.price,
		  quantity: cartItem.curr_quantity,
		};
		// Push the order item to the orderItems array
		orderItems.push(orderItem);
	  }
  
	  const order = new orderSchema({
		user_name: user.displayName,
		email: user.email,
		phone,
		address,
		pincode,
		state,
		country,
		total_amount,
		order_items: orderItems,
	  });
	  await order.save();
  
	  // Clear the user's cart
	  user.cart = [];
	  // Add the order to the user's order history
	  user.order_history.push({
		order_date: new Date(),
		order_items: orderItems,
		total_amount: total_amount,
	  });
	  await user.save();
  
	  res.status(200).json({ message: 'Order placed successfully' });
	  console.log(`Order placed successfully by ${user.displayName}`);
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ error: 'Internal server error' });
	  console.log("Error placing order");
	}
  });

  

// ============================================================================ user review - footer page ===================================================================

  router.post('/submit-review', authenticate , async (req, res) => {
	try {
		const {message} = req.body;
		const user = await userSchema.findOne({ _id: req.userID });
		if (!user) {
		  return res.status(404).json({ message: 'User not found' });
		}
  
	  // Create a new review
	  const review = new reviewSchema({
		user: user.displayName,
		email: user.email,
		message: message,
	  });
  
	  // Save the review to the database
	  await review.save();
	  console.log("message saved");
	  res.status(201).json({ message: 'Review submitted successfully' });
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
  });
  

module.exports = router; 