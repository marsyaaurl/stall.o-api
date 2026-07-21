import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "./config/passport.js";
import authRoutes from "./modules/public/auth/auth.routes.js";
import healthRoutes from "./modules/public/health/health.routes.js";
import sellerDashboardRoutes from "./modules/seller/dashboard/seller-dashboard.routes.js";
const app = express();
app.use(helmet());
app.use(passport.initialize());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
// Public / Auth Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
// Seller Sub-Domain Endpoints
app.use("/api/seller", sellerDashboardRoutes);
export default app;
