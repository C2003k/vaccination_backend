import { findUserById, updateExistingUser } from "../repositories/UserRepository.js";
import { getChildrenByParentId } from "./ChildService.js";
import { getAllVaccines } from "./VaccineService.js";
import { getRecordsByChildId } from "./VaccinationRecordService.js";
import { ROLES } from "../config/roles.js";

const defaultPreferences = {
  smsReminders: true,
  phoneReminders: false,
  daysBefore: [7, 3, 1],
  timeOfDay: "09:00",
  language: "english",
};

export const getMotherById = async (motherId) => {
  const mother = await findUserById(motherId, { password: 0 });
  if (!mother) {
    throw new Error("Mother not found");
  }
  if (mother.role !== ROLES.MOTHER) {
    throw new Error("User is not a mother");
  }
  return mother;
};

export const getReminderPreferences = async (motherId) => {
  const mother = await getMotherById(motherId);
  return mother.reminderPreferences || defaultPreferences;
};

export const updateReminderPreferences = async (motherId, preferences) => {
  const mother = await getMotherById(motherId);

  const updated = {
    reminderPreferences: {
      smsReminders:
        typeof preferences.smsReminders === "boolean"
          ? preferences.smsReminders
          : mother.reminderPreferences?.smsReminders ?? defaultPreferences.smsReminders,
      phoneReminders:
        typeof preferences.phoneReminders === "boolean"
          ? preferences.phoneReminders
          : mother.reminderPreferences?.phoneReminders ?? defaultPreferences.phoneReminders,
      daysBefore: Array.isArray(preferences.daysBefore)
        ? preferences.daysBefore
        : mother.reminderPreferences?.daysBefore ?? defaultPreferences.daysBefore,
      timeOfDay:
        typeof preferences.timeOfDay === "string"
          ? preferences.timeOfDay
          : mother.reminderPreferences?.timeOfDay ?? defaultPreferences.timeOfDay,
      language:
        typeof preferences.language === "string"
          ? preferences.language
          : mother.reminderPreferences?.language ?? defaultPreferences.language,
    },
  };

  return await updateExistingUser(motherId, updated);
};

const getDueDate = (dob, vaccine) => {
  if (!dob || !vaccine?.recommendedAge) return null;
  const dueDate = new Date(dob);
  const months = vaccine.recommendedAge.months || 0;
  const weeks = vaccine.recommendedAge.weeks || 0;
  dueDate.setMonth(dueDate.getMonth() + months);
  dueDate.setDate(dueDate.getDate() + weeks * 7);
  return dueDate;
};

const daysBetween = (from, to) => {
  const diffMs = to.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getMotherReminders = async (motherId) => {
  const mother = await getMotherById(motherId);
  const children = await getChildrenByParentId(motherId);
  const vaccines = await getAllVaccines(true);

  const now = new Date();
  const upcomingReminders = [];
  const pastReminders = [];

  for (const child of children) {
    const records = await getRecordsByChildId(child._id);
    const recordMap = new Map();
    records.forEach((record) => {
      if (record?.vaccine?._id && !recordMap.has(record.vaccine._id.toString())) {
        recordMap.set(record.vaccine._id.toString(), record);
      }
    });

    vaccines.forEach((vaccine) => {
      const dueDate = getDueDate(child.dateOfBirth, vaccine);
      if (!dueDate) return;

      const record = recordMap.get(vaccine._id.toString());
      if (record) {
        pastReminders.push({
          id: record._id,
          childId: child._id,
          childName: child.name,
          vaccineId: vaccine._id,
          vaccineName: vaccine.name,
          dueDate,
          sentDate: record.dateGiven,
          type: "sms",
          status: "delivered",
        });
        return;
      }

      const daysUntil = daysBetween(now, dueDate);
      const reminderType = daysUntil < 0 ? "overdue" : "upcoming";
      upcomingReminders.push({
        id: `${child._id}-${vaccine._id}`,
        childId: child._id,
        childName: child.name,
        vaccineId: vaccine._id,
        vaccineName: vaccine.name,
        dueDate,
        daysUntil,
        reminderType,
        status: "scheduled",
      });
    });
  }

  upcomingReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  pastReminders.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

  return {
    motherId: mother._id,
    upcomingReminders,
    pastReminders,
  };
};
