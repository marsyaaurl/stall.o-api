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

        // Upsert by unique email to prevent unique constraint collisions
        const user = await prisma.user.upsert({
          where: {
            email,
          },

          update: {
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            providerId: profile.id,
            provider: "GOOGLE",
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
        console.error("Passport Google Strategy error:", error);
        return done(error as Error, false);
      }
    },
  ),
);

export default passport;