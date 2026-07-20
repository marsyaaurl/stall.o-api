import "dotenv/config";
import app from "./app.js";
import passport from "./config/passport.js";
const PORT = process.env.PORT || 5000;
app.use(passport.initialize());
app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Stall-o API running on port ${PORT}`);
});
