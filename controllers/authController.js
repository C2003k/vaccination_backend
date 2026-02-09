import { loginUser, registerUser } from "../services/AuthService.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const userData = req.body;

    // Call the register service
    const result = await registerUser(userData);

    if (!result.success) {
      // Return appropriate status code
      const statusCode = result.message.includes("already exists")
        ? 409
        : result.message.includes("required") ||
          result.message.includes("Invalid")
        ? 400
        : 500;

      return res.status(statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // Registration successful
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Call the login service
    const result = await loginUser({ email, password });

    // Check if login was successful
    if (!result.success) {
      // Return appropriate status code based on error
      const statusCode = result.message.includes("Invalid")
        ? 401
        : result.message.includes("deactivated")
        ? 403
        : 400;

      return res.status(statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // Login successful
    res.json({
      success: true,
      message: "Login successful",
      data: result.data,
    });
  } catch (error) {
    console.error("Login controller error:", error);

    // Handle unexpected errors
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // User is attached to req by verifyJWT middleware
    const user = req.user;

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving user data",
    });
  }
};
