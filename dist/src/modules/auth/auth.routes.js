import { Router } from "express";
import passport from "./../../config/passport.js";
const router = Router();
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
}));
router.get("/google/callback", passport.authenticate("google", {
    session: false,
}), (req, res) => {
    res.json({
        message: "Google login successful",
        user: req.user,
    });
});
export default router;
