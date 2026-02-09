import { ROLES } from "../config/roles.js";

/**
 * Middleware to verify user roles
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware function
 */
export const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const verifyAdmin = verifyRoles(ROLES.ADMIN);

/**
 * Middleware to check if user is health worker or admin
 */
export const verifyHealthWorker = verifyRoles(
  ROLES.HEALTH_WORKER,
  ROLES.HOSPITAL_STAFF,
  ROLES.ADMIN
);

/**
 * Middleware to check if user is mother
 */
export const verifyMother = verifyRoles(ROLES.MOTHER);

export default verifyRoles;
