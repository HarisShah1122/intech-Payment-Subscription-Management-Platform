import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails?.[0]?.value }
      ]
    });

    if (user) {
      // Update Google ID if user exists by email but doesn't have Google ID
      if (!user.googleId && profile.id) {
        user.googleId = profile.id;
        await user.save();
      }
      
      logger.info('Google OAuth: Existing user logged in', {
        userId: user._id,
        email: user.email,
        googleId: profile.id,
      });
      
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      avatar: profile.photos?.[0]?.value,
      emailVerified: true, // Google accounts are verified
    });

    await newUser.save();

    logger.info('Google OAuth: New user created', {
      userId: newUser._id,
      email: newUser.email,
      googleId: profile.id,
    });

    return done(null, newUser);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error as Error, undefined);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error as Error, null);
  }
});

export default passport;
