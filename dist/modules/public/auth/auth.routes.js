import { Router } from "express";
import passport from "../../../config/passport.js";
import { generateToken } from "../../../utils/jwt.js";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { prisma } from "../../../config/prisma.js";
const router = Router();
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
}));
router.get("/google/callback", passport.authenticate("google", {
    session: false,
}), (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Authentication failed" });
        return;
    }
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});
router.get("/me", authenticateJWT, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
export default router;
