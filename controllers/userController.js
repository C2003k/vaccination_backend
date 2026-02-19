import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  updateUserPassword,
} from "../services/UserService.js";

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const returnAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const returnUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id ${userId} was not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateAnExistingUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is updating their own profile or is admin
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user profile",
      });
    }

    const updatedUser = await updateUser(userId, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteAnExistingUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await deleteUser(userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get users by role
 * @route   GET /api/users/role/:role
 * @access  Private/Admin
 */
export const getUsersByRoleHandler = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await getUsersByRole(role);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    if (error.message === "Invalid role provided") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/users/:id/password
 * @access  Private
 */
export const updateUserPasswordHandler = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Check if user is updating their own password
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user password",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const result = await updateUserPassword(
      userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("Current password is incorrect")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new user (Admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
export const createUserHandler = async (req, res) => {
  try {
    const userData = req.body;

    // Check if user with email or username already exists
    // This logic duplicates some of registerService but we need it here for Admin creation

    // We can import registerUser service or implement directly.
    // Let's reuse registerUser logic from AuthService if possible, or duplicate for simplicity here since imports might be circular.
    // Actually, userController imports from UserService.js. Let's see if UserService has createUser.
    // Assuming we need to implement it here or call a service.

    // For now, let's just use the createUser logic directly using registerUser from AuthService
    // But we need to import it.

    const { registerUser } = await import("../services/AuthService.js");
    const result = await registerUser(userData);

    if (!result.success) {
      const statusCode = result.message.includes("already exists") ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result.data
    });

  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
