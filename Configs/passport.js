const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../Models/User");
const { url } = require("./cloudinaryConfig");

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:5000/user/auth/twitter/callback",
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const user = await User.findOne({ TwitterId: profile.id });
        if (!user) {
          const userProfileImage = profile._json.profile_image_url_https;
          const image = userProfileImage.replace("_normal", "");
          const UsedUsername = await User.find({
            username: profile.username.toLowerCase(),
          });
          const newUser = new User({
            TwitterId: profile.id,
            username: UsedUsername
              ? profile.username.toLowerCase() + profile.id.slice(0, 5)
              : profile.username.toLowerCase(),
            avatar: {
              url: image,
              publicId: null,
            },
            bio:
              profile._json.description && profile._json.description != ""
                ? profile._json.description
                : "Hello, I'm a new user!",
          });
          await newUser.save();
          return done(null, newUser);
        }
        // Return the user
        return done(null, user);
      } catch (error) {
        // Handle errors
        return done(error, null);
      }
    }
  )
);

// Serialize user information to session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
