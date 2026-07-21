import { Router } from "express";
import passport from "../../../config/passport.js";
import { generateToken } from "../../../utils/jwt.js";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { prisma } from "../../../config/prisma.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err: any, user: any) => {
    if (err) {
      console.error("❌ Google OAuth Callback Error:", err);
      res.status(500).json({
        message: "Google OAuth authentication failed",
        error: err.message || String(err),
      });
      return;
    }

    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, next);
});

router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
