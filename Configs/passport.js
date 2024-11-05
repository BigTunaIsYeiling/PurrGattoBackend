const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../Models/User");
const { TwitterApi } = require("twitter-api-v2");

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: `${process.env.BASE_URL}/user/auth/twitter/callback`,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        // Check if the user already exists
        let user = await User.findOne({ TwitterId: profile.id });
        if (!user) {
          const userProfileImage = profile._json.profile_image_url_https;
          const image = userProfileImage.replace("_normal", "");
          const UsedUsername = await User.findOne({
            username: profile.username.toLowerCase(),
          });

          user = new User({
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

          await user.save();
        }

        // Initialize Twitter API client with user's access token and secret
        const twitterClient = new TwitterApi({
          appKey: process.env.TWITTER_CONSUMER_KEY,
          appSecret: process.env.TWITTER_CONSUMER_SECRET,
          accessToken: token,
          accessSecret: tokenSecret,
        });
        // Return the user
        return done(null, user);
      } catch (error) {
        // Handle errors
        console.error("Error fetching liked tweets:", error);
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
