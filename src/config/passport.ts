import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
} from "passport-google-oauth20";

import { prisma } from "./prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account does not have an email"),
            false,
          );
        }

        const user = await prisma.user.upsert({
          where: {
            providerId: profile.id,
          },

          update: {
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          },

          create: {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            provider: "GOOGLE",
            providerId: profile.id,
            role: "SELLER",
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;