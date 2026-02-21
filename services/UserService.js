import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Child from "../models/Child.js";
import Appointment from "../models/Appointment.js";
import Schedule from "../models/Schedule.js";
import VaccineStock from "../models/VaccineStock.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import Notification from "../models/Notification.js";
import {
  findUserById,
  updateExistingUser,
  deleteExistingUser,
  findUserByEmail,
  findUserByUsername,
  findUserByPhoneNumber,
  addNewUser,
} from "../repositories/UserRepository.js";
import { createNewChild } from "../repositories/ChildRepository.js";
import { ROLES } from "../config/roles.js";

const SENSITIVE_FIELDS = {
  password: 0,
  __v: 0,
};

const sanitizeUser = (user) => {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject() : user;
  const { password, __v, ...safeUser } = userObj;
  return safeUser;
};

const normalizeRole = (role) => {
  if (!role) return role;
  const normalized = String(role).toLowerCase().trim();

  if (normalized === "health-worker") return ROLES.HEALTH_WORKER;
  if (normalized === "health_worker") return ROLES.HEALTH_WORKER;
  if (normalized === "hospital") return ROLES.HOSPITAL_STAFF;
  if (normalized === "hospital_staff") return ROLES.HOSPITAL_STAFF;
  if (normalized === "mother") return ROLES.MOTHER;
  if (normalized === "admin") return ROLES.ADMIN;

  return normalized;
};

const normalizePhone = (phone) => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  return digits;
};

const validatePhone = (phone) => {
  if (!phone) return;

  if (!/^254\d{9}$/.test(phone)) {
    throw new Error("Phone must be in format 254712345678");
  }
};

const ensureHospitalExists = async (hospitalId) => {
  if (!hospitalId) return;
  const exists = await Hospital.exists({ _id: hospitalId });
  if (!exists) {
    throw new Error("Hospital not found");
  }
};

const buildUsersQuery = (filters = {}) => {
  const query = {};

  const role = normalizeRole(filters.role);
  if (role && role !== "all") {
    query.role = role;
  }

  if (filters.status && filters.status !== "all") {
    query.isActive = filters.status === "active";
  }

  if (filters.county && filters.county !== "all") {
    query.county = filters.county;
  }

  if (filters.hospital && filters.hospital !== "all") {
    query.hospital = filters.hospital;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, "i");
    query.$or = [
      { name: regex },
      { username: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return query;
};

const resolveIsActive = (input) => {
  if (typeof input === "boolean") return input;

  if (typeof input === "string") {
    const normalized = input.toLowerCase();
    if (normalized === "active") return true;
    if (normalized === "inactive" || normalized === "suspended") return false;
  }

  return true;
};

const createUserPayload = async (userData) => {
  const {
    name,
    username,
    email,
    password,
    role,
    phone,
    county,
    subCounty,
    ward,
    location,
    hospital,
    facility,
    assignedCHW,
    isActive,
    status,
  } = userData;

  const normalizedRole = normalizeRole(role);

  if (!name || !email || !password || !normalizedRole) {
    throw new Error("Name, email, password and role are required");
  }

  if (!Object.values(ROLES).includes(normalizedRole)) {
    throw new Error("Invalid role provided");
  }

  const resolvedUsername = (username || email).toLowerCase().trim();
  const resolvedEmail = email.toLowerCase().trim();

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(resolvedEmail)) {
    throw new Error("Please provide a valid email address");
  }

  if (String(password).length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const existingUserByEmail = await findUserByEmail(resolvedEmail);
  if (existingUserByEmail) {
    throw new Error("User with this email already exists");
  }

  const existingUserByUsername = await findUserByUsername(resolvedUsername);
  if (existingUserByUsername) {
    throw new Error("User with this username already exists");
  }

  const normalizedPhone = normalizePhone(phone);
  validatePhone(normalizedPhone);

  if (normalizedPhone) {
    const existingUserByPhone = await findUserByPhoneNumber(normalizedPhone);
    if (existingUserByPhone) {
      throw new Error("User with this phone number already exists");
    }
  }

  if (normalizedRole === ROLES.MOTHER) {
    if (!normalizedPhone || !subCounty || !ward || !location) {
      throw new Error(
        "Phone, sub-county, ward, and location are required for mother role"
      );
    }
  }

  const resolvedHospital = facility || hospital;
  if (resolvedHospital && [ROLES.HOSPITAL_STAFF, ROLES.HEALTH_WORKER].includes(normalizedRole)) {
    await ensureHospitalExists(resolvedHospital);
  }

  return {
    name: name.trim(),
    username: resolvedUsername,
    email: resolvedEmail,
    password,
    role: normalizedRole,
    phone: normalizedPhone,
    county,
    subCounty,
    ward,
    location,
    assignedCHW,
    hospital:
      resolvedHospital && [ROLES.HOSPITAL_STAFF, ROLES.HEALTH_WORKER].includes(normalizedRole)
        ? resolvedHospital
        : undefined,
    isActive: resolveIsActive(status ?? isActive),
  };
};

const toDateWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const resolveHospitalForUser = async (userId) => {
  const user = await User.findById(userId).select("hospital").lean();

  if (user?.hospital) {
    return user.hospital;
  }

  const hospital = await Hospital.findOne({ adminUsers: userId, isActive: true })
    .select("_id")
    .lean();

  return hospital?._id;
};

const buildMetric = (key, label, value, tone = "default") => ({
  key,
  label,
  value,
  tone,
});

const getAdminNavbarStats = async () => {
  const [
    totalUsers,
    activeHospitals,
    totalStockEntries,
    healthyStockEntries,
    activeChws,
  ] = await Promise.all([
    User.countDocuments(),
    Hospital.countDocuments({ isActive: true }),
    VaccineStock.countDocuments(),
    VaccineStock.countDocuments({ status: { $in: ["adequate", "low"] } }),
    User.countDocuments({ role: ROLES.HEALTH_WORKER, isActive: true }),
  ]);

  const stockPercent =
    totalStockEntries > 0
      ? Math.round((healthyStockEntries / totalStockEntries) * 100)
      : 0;

  const systemStatus = User.db.readyState === 1 ? "Online" : "Degraded";

  return [
    buildMetric("total_users", "Total Users", totalUsers.toLocaleString()),
    buildMetric("active_hospitals", "Active Hospitals", activeHospitals.toLocaleString()),
    buildMetric("active_chws", "Active CHWs", activeChws.toLocaleString()),
    buildMetric(
      "vaccine_stock",
      "Vaccine Stock",
      `${stockPercent}%`,
      stockPercent >= 70 ? "success" : "warning"
    ),
    buildMetric(
      "system_status",
      "System Status",
      systemStatus,
      systemStatus === "Online" ? "success" : "warning"
    ),
  ];
};

const getHospitalNavbarStats = async (userId) => {
  const hospitalId = await resolveHospitalForUser(userId);
  const { start, end } = toDateWindow();

  if (!hospitalId) {
    return [
      buildMetric("today_appointments", "Today's Appointments", "0"),
      buildMetric("vaccine_stock", "Vaccine Stock", "0%", "warning"),
      buildMetric("staff_on_duty", "Staff On Duty", "0"),
      buildMetric("system_status", "System Status", "Unlinked", "warning"),
    ];
  }

  const [todayAppointments, activeStaff, totalStockEntries, healthyStockEntries] = await Promise.all([
    Appointment.countDocuments({
      hospital: hospitalId,
      scheduledDate: { $gte: start, $lte: end },
      status: { $nin: ["cancelled"] },
    }),
    User.countDocuments({
      role: ROLES.HOSPITAL_STAFF,
      hospital: hospitalId,
      isActive: true,
    }),
    VaccineStock.countDocuments({ hospital: hospitalId }),
    VaccineStock.countDocuments({
      hospital: hospitalId,
      status: { $in: ["adequate", "low"] },
    }),
  ]);

  const stockPercent =
    totalStockEntries > 0
      ? Math.round((healthyStockEntries / totalStockEntries) * 100)
      : 0;

  const pendingCases = await Appointment.countDocuments({
    hospital: hospitalId,
    status: { $in: ["scheduled", "confirmed"] },
    scheduledDate: { $gte: new Date() },
  });

  return [
    buildMetric("today_appointments", "Today's Appointments", todayAppointments.toLocaleString()),
    buildMetric(
      "vaccine_stock",
      "Vaccine Stock",
      `${stockPercent}%`,
      stockPercent >= 70 ? "success" : "warning"
    ),
    buildMetric("staff_on_duty", "Staff On Duty", activeStaff.toLocaleString()),
    buildMetric("pending_cases", "Pending Cases", pendingCases.toLocaleString()),
  ];
};

const getHealthWorkerNavbarStats = async (userId) => {
  const { start, end } = toDateWindow();

  const [todayVisits, vaccinationsDone, pendingFollowUps, assignedMothers] = await Promise.all([
    Schedule.countDocuments({
      healthWorker: userId,
      scheduledDate: { $gte: start, $lte: end },
      status: { $nin: ["cancelled"] },
    }),
    VaccinationRecord.countDocuments({
      givenBy: userId,
      dateGiven: { $gte: start, $lte: end },
    }),
    Schedule.countDocuments({
      healthWorker: userId,
      type: "follow_up",
      status: "scheduled",
      scheduledDate: { $gte: new Date() },
    }),
    User.countDocuments({ role: ROLES.MOTHER, assignedCHW: userId, isActive: true }),
  ]);

  return [
    buildMetric("today_visits", "Today's Visits", todayVisits.toLocaleString()),
    buildMetric("vaccinations_done", "Vaccinations Done", vaccinationsDone.toLocaleString()),
    buildMetric("pending_followups", "Pending Follow-ups", pendingFollowUps.toLocaleString()),
    buildMetric("assigned_mothers", "Assigned Mothers", assignedMothers.toLocaleString()),
  ];
};

const getMotherNavbarStats = async (userId) => {
  const children = await Child.find({ parent: userId, isActive: true }).select("_id").lean();
  const childIds = children.map((child) => child._id);

  const [upcomingAppointments, completedDoses, unreadNotifications, nextAppointment] = await Promise.all([
    Appointment.countDocuments({
      mother: userId,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledDate: { $gte: new Date() },
    }),
    childIds.length > 0
      ? VaccinationRecord.countDocuments({ child: { $in: childIds } })
      : 0,
    Notification.countDocuments({ user: userId, isRead: false }),
    Appointment.findOne({
      mother: userId,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledDate: { $gte: new Date() },
    })
      .sort({ scheduledDate: 1 })
      .select("scheduledDate")
      .lean(),
  ]);

  const nextAppointmentLabel = nextAppointment?.scheduledDate
    ? new Date(nextAppointment.scheduledDate).toLocaleDateString()
    : "Not Scheduled";

  return [
    buildMetric("children_registered", "Children Registered", childIds.length.toLocaleString()),
    buildMetric("upcoming_vaccinations", "Upcoming Vaccinations", upcomingAppointments.toLocaleString()),
    buildMetric("completed_doses", "Completed Doses", completedDoses.toLocaleString()),
    buildMetric("next_appointment", "Next Appointment", nextAppointmentLabel),
    buildMetric("unread_notifications", "Unread Alerts", unreadNotifications.toLocaleString()),
  ];
};

export const getAllUsers = async (filters = {}) => {
  const query = buildUsersQuery(filters);

  const users = await User.find(query, SENSITIVE_FIELDS)
    .populate("children")
    .populate("hospital", "name type location")
    .sort({ createdAt: -1 });

  return users.map(sanitizeUser);
};

export const getUserById = async (userId) => {
  const user = await findUserById(userId, SENSITIVE_FIELDS);
  return sanitizeUser(user);
};

export const createNewUser = async (userData) => {
  const payload = await createUserPayload(userData);
  const user = await addNewUser(payload);

  if (
    payload.role === ROLES.MOTHER &&
    Array.isArray(userData.children) &&
    userData.children.length > 0
  ) {
    await Promise.all(
      userData.children.map((childData) =>
        createNewChild({
          parent: user._id,
          name: childData.name,
          dateOfBirth: childData.dateOfBirth,
          gender: childData.gender,
        })
      )
    );
  }

  return sanitizeUser(user);
};

export const createUserByAdmin = async (userData) => {
  return createNewUser(userData);
};

export const updateUser = async (userId, userData) => {
  const updateData = { ...userData };

  if (updateData.facility && !updateData.hospital) {
    updateData.hospital = updateData.facility;
  }

  if (updateData.status && updateData.isActive === undefined) {
    updateData.isActive = resolveIsActive(updateData.status);
  }

  if (updateData.role) {
    updateData.role = normalizeRole(updateData.role);
    if (!Object.values(ROLES).includes(updateData.role)) {
      throw new Error("Invalid role provided");
    }
  }

  if (updateData.phone) {
    updateData.phone = normalizePhone(updateData.phone);
    validatePhone(updateData.phone);

    const existingUser = await findUserByPhoneNumber(updateData.phone);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this phone number already exists");
    }
  }

  if (updateData.email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(updateData.email)) {
      throw new Error("Please provide a valid email address");
    }

    updateData.email = updateData.email.toLowerCase().trim();

    const existingUser = await findUserByEmail(updateData.email);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this email already exists");
    }
  }

  if (updateData.username) {
    updateData.username = updateData.username.toLowerCase().trim();

    const existingUser = await findUserByUsername(updateData.username);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this username already exists");
    }
  }

  if (updateData.hospital) {
    await ensureHospitalExists(updateData.hospital);
  }

  delete updateData.password;
  delete updateData.status;
  delete updateData.facility;
  delete updateData.firstName;
  delete updateData.lastName;

  const updatedUser = await updateExistingUser(userId, updateData);
  if (!updatedUser) {
    throw new Error("User not found");
  }

  return sanitizeUser(updatedUser);
};

export const deleteUser = async (userId) => {
  const deletedUser = await deleteExistingUser(userId);
  if (!deletedUser) {
    throw new Error("User not found");
  }
  return { message: "User deleted successfully" };
};

export const getUsersByRole = async (role, filters = {}) => {
  const normalizedRole = normalizeRole(role);

  if (!Object.values(ROLES).includes(normalizedRole)) {
    throw new Error("Invalid role provided");
  }

  return await getAllUsers({ ...filters, role: normalizedRole });
};

export const updateUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  if (String(currentPassword).trim() === String(newPassword).trim()) {
    throw new Error("New password must be different from current password");
  }

  const password = String(newPassword);
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!(hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password updated successfully" };
};

export const getNavbarStats = async (authUser) => {
  const userId = authUser?.id || authUser?._id || authUser?.userId;
  const role = normalizeRole(authUser?.role);

  if (!userId || !role) {
    throw new Error("Invalid authenticated user context");
  }

  let metrics = [];

  if (role === ROLES.ADMIN) {
    metrics = await getAdminNavbarStats();
  } else if (role === ROLES.HOSPITAL_STAFF) {
    metrics = await getHospitalNavbarStats(userId);
  } else if (role === ROLES.HEALTH_WORKER) {
    metrics = await getHealthWorkerNavbarStats(userId);
  } else if (role === ROLES.MOTHER) {
    metrics = await getMotherNavbarStats(userId);
  }

  return {
    role,
    metrics,
    updatedAt: new Date().toISOString(),
  };
};
