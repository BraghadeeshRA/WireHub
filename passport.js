const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require('./schema/userSchema');

//FOR BOTH SIGNUP AND LOGIN
passport.use('google',
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "/auth/google/signup/callback",
			scope: ["profile", "email"],
		},
		async (accessToken, refreshToken, profile, callback) =>{
			
			const googleId = profile.id;
      		const displayName = profile.displayName;
      		const email = profile.emails[0].value;

			console.log("User details:");
			console.log("googleID:",googleId);
			console.log("Name:",displayName);
			console.log("email:",email);
			console.log("========================");

			
			try {
				// Check if a user with the same email already exists
				const existingUser = await User.findOne({ email });
		
                //if existing user not found , save the user to the collection
				if (!existingUser) {

				  console.log("New User !!!");

                  const user = await new User({
                    googleId,
                    displayName,
                    email,
                  }).save();
				  
				  token = await user.generateAuthToken();
				  console.log("token generated while registering");
				  console.log(token);
				  console.log("========================");
				}
				else{
					console.log("Existing user");
					token = await existingUser.generateAuthToken();
					console.log("token generated while logging in");
					console.log(token);
					console.log("========================");
				}
				
		        callback(null, {profile,token});

			  } 
              catch (error) {
				callback(error, null);
			  }

		}
	)
);


passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});
