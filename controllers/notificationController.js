import Notification from "../models/Notification.js";

const ensureNotificationAccess = (notification, user) => {
  if (!notification) {
    const error = new Error("Notification not found");
    error.status = 404;
    throw error;
  }

  if (user.role !== "admin" && notification.user.toString() !== user.id) {
    const error = new Error("Not authorized to access this notification");
    error.status = 403;
    throw error;
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority, metadata } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });
    }

    const notification = await Notification.create({
      user: userId || req.user.id,
      title,
      message,
      type,
      priority,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const notification = await Notification.findById(id);
    ensureNotificationAccess(notification, req.user);

    const allowedUpdates = ["title", "message", "type", "priority", "metadata", "isRead"];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        notification[field] = updates[field];
      }
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: notification,
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    ensureNotificationAccess(notification, req.user);

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    ensureNotificationAccess(notification, req.user);

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
