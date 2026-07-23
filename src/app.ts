import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "./config/passport.js";
import authRoutes from "./modules/public/auth/auth.routes.js";
import healthRoutes from "./modules/public/health/health.routes.js";
import sellerDashboardRoutes from "./modules/seller/dashboard/seller-dashboard.routes.js";
import sellerProductsRoutes from "./modules/seller/products/products.routes.js";
import sellerMachinesRoutes from "./modules/seller/machines/machine.routes.js";
import sellerReservationsRoutes from "./modules/seller/reservations/reservations.routes.js";
import sellerInventoryRoutes from "./modules/seller/inventory/inventory.routes.js";
import sellerSalesRoutes from "./modules/seller/sales/sales.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";

const app = express();

app.use(helmet());
app.use(passport.initialize());

// Robust CORS config allowing Vercel deployment URLs & localhost
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "https://stallo-web-ten.vercel.app",
      ].filter(Boolean) as string[];

      const normalizedOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, "") === normalizedOrigin
      );

      if (isAllowed || origin.includes("vercel.app") || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Public & Auth Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/customer", customerRoutes);

// Seller Sub-Domain Endpoints
app.use("/api/seller", sellerDashboardRoutes);
app.use("/api/seller/products", sellerProductsRoutes);
app.use("/api/seller/machines", sellerMachinesRoutes);
app.use("/api/seller/reservations", sellerReservationsRoutes);
app.use("/api/seller/inventory", sellerInventoryRoutes);
app.use("/api/seller/sales", sellerSalesRoutes);

export default app;