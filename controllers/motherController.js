import {
  getMotherById,
  getReminderPreferences,
  updateReminderPreferences,
  getMotherReminders,
} from "../services/MotherService.js";
import { getChildrenByParentId } from "../services/ChildService.js";

export const getMotherHandler = async (req, res) => {
  try {
    const motherId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const isAuthorized =
      motherId === userId ||
      ["admin", "health_worker", "hospital_staff"].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this mother",
      });
    }

    const mother = await getMotherById(motherId);
    res.status(200).json({ success: true, data: mother });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving mother",
    });
  }
};

export const getMotherChildrenHandler = async (req, res) => {
  try {
    const motherId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const isAuthorized =
      motherId === userId ||
      ["admin", "health_worker", "hospital_staff"].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access these children",
      });
    }

    const children = await getChildrenByParentId(motherId);
    res.status(200).json({
      success: true,
      count: children.length,
      data: children,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving children",
    });
  }
};

export const getReminderPreferencesHandler = async (req, res) => {
  try {
    const motherId = req.params.id;
    const userId = req.user.id;

    if (motherId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access reminder preferences",
      });
    }

    const preferences = await getReminderPreferences(motherId);
    res.status(200).json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving reminder preferences",
    });
  }
};

export const updateReminderPreferencesHandler = async (req, res) => {
  try {
    const motherId = req.params.id;
    const userId = req.user.id;

    if (motherId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update reminder preferences",
      });
    }

    const updated = await updateReminderPreferences(motherId, req.body || {});
    res.status(200).json({
      success: true,
      message: "Reminder preferences updated",
      data: updated.reminderPreferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating reminder preferences",
    });
  }
};

export const getMotherRemindersHandler = async (req, res) => {
  try {
    const motherId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const isAuthorized =
      motherId === userId ||
      ["admin", "health_worker", "hospital_staff"].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access reminders",
      });
    }

    const reminders = await getMotherReminders(motherId);
    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving reminders",
    });
  }
};
