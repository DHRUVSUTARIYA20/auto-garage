import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("\n🔐 [authenticate] Verifying token");
    
    // Get token from cookies or Authorization header
    const tokenFromCookie = req.cookies.token;
    const tokenFromHeader = req.headers.authorization?.replace("Bearer ", "");
    const token = tokenFromCookie || tokenFromHeader;
    
    console.log("   Cookie token exists:", !!tokenFromCookie);
    console.log("   Header token exists:", !!tokenFromHeader);
    console.log("   Using token:", !!token);
    
    if (!token) {
      console.log("   ❌ No token found! Rejecting request");
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log("   Token length:", token.length, "chars");
    console.log("   Token starts with:", token.substring(0, 20) + "...");

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    
    console.log("   ✅ Token verified successfully");
    console.log("   Decoded userId:", decoded.userId);
    console.log("   Decoded role:", decoded.role || "user");
    
    req.userId = decoded.userId;
    req.userRole = decoded.role || "user";
    
    console.log("   Set req.userId to:", req.userId);
    console.log("   Set req.userRole to:", req.userRole);
    
    next();
  } catch (error: any) {
    console.error("   ❌ Auth error:", error?.message || error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
