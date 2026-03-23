import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load env BEFORE importing modules that depend on env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config();

import authRoutes from "./routes/auth";
import garagesRoutes from "./routes/garages";
import bookingsRoutes from "./routes/bookings";
import staffRoutes from "./routes/staff";
import contactRoutes from "./routes/contact";
import { getPrismaHealth } from "./lib/prisma";
import { isFirebaseConfigured } from "./lib/firebase-admin";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Guard backend routes if Firebase is not configured
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/contact") {
    return next();
  }

  if (!isFirebaseConfigured) {
    return res.status(503).json({
      error: "Server Firebase config missing. Set FIREBASE_PROJECT_ID and service account credentials.",
    });
  }

  return next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/garages", garagesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/contact", contactRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API server is running",
    firebase: isFirebaseConfigured ? "configured" : "missing-env",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
