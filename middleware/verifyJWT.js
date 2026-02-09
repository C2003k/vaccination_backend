import jwt from "jsonwebtoken";
import { findUserById } from "../repositories/UserRepository.js";

const ACCESS_KEY = process.env.JWT_SECRET;

/**
 * Verify JWT token middleware
 */
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Check if the authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, ACCESS_KEY);

    // Get user from token
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is no longer valid. User not found.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated.",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Token has expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

export default verifyJWT;
