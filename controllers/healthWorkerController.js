import User from "../models/User.js";
import Child from "../models/Child.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import Schedule from "../models/Schedule.js";
import Vaccine from "../models/Vaccine.js";
import FieldReport from "../models/FieldReport.js";
import Notification from "../models/Notification.js";
import { ROLES } from "../config/roles.js";
import { calculateUpcomingVaccines, calculateVaccinationStatus } from "../utils/vaccineScheduler.js";

/**
 * Get dashboard statistics for a Community Health Worker
 * @route GET /api/health-worker/stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const chwId = req.user.id;

        // 1. Get Assigned Mothers Count
        const assignedMothersCount = await User.countDocuments({
            role: ROLES.MOTHER,
            assignedCHW: chwId,
            isActive: true,
        });

        // 2. Get Upcoming Vaccinations (next 30 days)
        // We will counting *scheduled appointments* for simplicity and performance for the dashboard stat.
        // Alternatively, we could calculate *due* vaccines, but that requires iterating all children.
        // Let's stick to confirmed schedules for "Upcoming Vaccinations" to encourage scheduling.
        const today = new Date();
        const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        const upcomingAppointments = await Schedule.countDocuments({
            healthWorker: chwId,
            status: "scheduled",
            scheduledDate: { $gte: today, $lte: next30Days },
        });

        // 3. Get Defaulters
        // Find mothers assigned to CHW
        const assignedMothers = await User.find({
            role: ROLES.MOTHER,
            assignedCHW: chwId,
        }).select("_id");

        const motherIds = assignedMothers.map((m) => m._id);

        // Find children of these mothers who are behind
        const defaultedChildrenCount = await Child.countDocuments({
            parent: { $in: motherIds },
            vaccinationStatus: "behind",
        });

        // 4. Calculate Coverage Rate
        const totalChildren = await Child.countDocuments({
            parent: { $in: motherIds },
        });

        const upToDateChildren = await Child.countDocuments({
            parent: { $in: motherIds },
            vaccinationStatus: "up-to-date",
        });

        const coverageRate = totalChildren > 0
            ? Math.round((upToDateChildren / totalChildren) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                assignedMothers: assignedMothersCount,
                upcomingVaccinations: upcomingAppointments,
                defaulters: defaultedChildrenCount,
                coverageRate: `${coverageRate}%`,
            },
        });
    } catch (error) {
        console.error("Error fetching CHW stats:", error);
        res.status(500).json({
            success: false,
            message: "Server Error fetching dashboard stats",
            error: error.message,
        });
    }
};

/**
 * Get list of assigned mothers with their children
 * @route GET /api/health-worker/assigned-mothers
 */
export const getAssignedMothers = async (req, res) => {
    try {
        const chwId = req.user.id;
        const { search, status } = req.query;

        let query = {
            role: ROLES.MOTHER,
            assignedCHW: chwId,
            isActive: true,
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        // Fetch mothers
        const mothers = await User.find(query)
            .select("name phone location subCounty ward lastLogin")
            .populate({
                path: "children",
                select: "name dateOfBirth gender vaccinationStatus",
            })
            .lean();

        // Fetch all vaccines once to pass to the scheduler
        const allVaccines = await Vaccine.find({ isActive: true });

        // Process each mother and her children
        const formattedMothers = await Promise.all(mothers.map(async (mother) => {
            const childrenWithDetails = await Promise.all(mother.children.map(async (child) => {
                // Fetch vaccination records for this child
                const records = await VaccinationRecord.find({ child: child._id });

                // Calculate upcoming vaccines
                const upcoming = await calculateUpcomingVaccines(child, allVaccines, records);

                // Determine next immediate vaccine
                const nextVaccine = upcoming.length > 0 ? upcoming[0] : null;

                return {
                    id: child._id,
                    name: child.name,
                    dob: child.dateOfBirth,
                    gender: child.gender,
                    status: child.vaccinationStatus,
                    upcomingVaccines: upcoming, // Send full list for frontend to use
                    nextVaccine: nextVaccine ? nextVaccine.name : "Fully Vaccinated",
                    dueDate: nextVaccine ? nextVaccine.dueDate : null,
                    daysLeft: nextVaccine ? nextVaccine.daysLeft : null
                };
            }));

            // Determine mother's status based on children
            // If any child is behind, mother is defaulting (or we can use child status)
            // But let's verify checking the 'upcoming' list for overdue items
            const isAnyChildBehind = childrenWithDetails.some(c =>
                c.status === 'behind' || c.upcomingVaccines.some(v => v.status === 'overdue')
            );

            const motherStatus = isAnyChildBehind ? 'defaulting' : 'up-to-date';

            return {
                id: mother._id,
                name: mother.name,
                phone: mother.phone || "N/A",
                village: mother.location || "N/A",
                subCounty: mother.subCounty || "N/A",
                lastVisit: mother.lastLogin,
                status: motherStatus,
                children: childrenWithDetails
            };
        }));

        // Apply status filter
        const finalResult = status && status !== 'all'
            ? formattedMothers.filter(m => m.status === status)
            : formattedMothers;

        res.status(200).json({
            success: true,
            count: finalResult.length,
            data: finalResult,
        });
    } catch (error) {
        console.error("Error fetching assigned mothers:", error);
        res.status(500).json({
            success: false,
            message: "Server Error fetching assigned mothers",
            error: error.message,
        });
    }
};

/**
 * Get CHW Schedule
 * @route GET /api/health-worker/schedule
 */
export const getSchedule = async (req, res) => {
    try {
        const chwId = req.user.id;
        const { date } = req.query;

        let query = { healthWorker: chwId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.scheduledDate = { $gte: startDate, $lte: endDate };
        }

        const schedule = await Schedule.find(query)
            .populate('mother', 'name phone')
            .sort({ scheduledDate: 1 });

        const formatted = schedule.map((item) => {
            const locationObj = item.location || {};
            const locationLabel =
                typeof locationObj === "string"
                    ? locationObj
                    : [locationObj.village, locationObj.ward, locationObj.subCounty]
                        .filter(Boolean)
                        .join(", ");

            return {
                ...item.toObject(),
                location: locationLabel || "N/A",
            };
        });

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Create Schedule
 * @route POST /api/health-worker/schedule
 */
export const createSchedule = async (req, res) => {
    try {
        const chwId = req.user.id;
        const { motherId, type, date, time, duration, purpose, priority, location } = req.body;

        const locationData =
            typeof location === "string"
                ? { village: location }
                : location || undefined;

        const schedule = await Schedule.create({
            healthWorker: chwId,
            mother: motherId,
            type,
            scheduledDate: date,
            scheduledTime: time,
            duration,
            purpose,
            priority,
            location: locationData
        });

        const locationObj = schedule.location || {};
        const locationLabel =
            typeof locationObj === "string"
                ? locationObj
                : [locationObj.village, locationObj.ward, locationObj.subCounty]
                    .filter(Boolean)
                    .join(", ");

        res.status(201).json({
            success: true,
            data: {
                ...schedule.toObject(),
                location: locationLabel || "N/A",
            }
        });
    } catch (error) {
        console.error("Error creating schedule:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Send reminder to assigned mother
 * @route POST /api/health-worker/mothers/:motherId/reminder
 */
export const sendMotherReminder = async (req, res) => {
    try {
        const chwId = req.user.id;
        const { motherId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const mother = await User.findById(motherId);
        if (!mother || mother.role !== ROLES.MOTHER) {
            return res.status(404).json({ success: false, message: "Mother not found" });
        }

        if (!mother.assignedCHW || mother.assignedCHW.toString() !== chwId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to send reminders to this mother",
            });
        }

        const notification = await Notification.create({
            user: mother._id,
            type: "reminder",
            priority: "medium",
            title: "Vaccination Reminder",
            message,
            metadata: { sentBy: chwId },
        });

        res.status(201).json({
            success: true,
            message: "Reminder sent successfully",
            data: notification,
        });
    } catch (error) {
        console.error("Error sending reminder:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Update Schedule
 * @route PATCH /api/health-worker/schedule/:id
 */
export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const schedule = await Schedule.findByIdAndUpdate(id, updates, { new: true });

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        const locationObj = schedule.location || {};
        const locationLabel =
            typeof locationObj === "string"
                ? locationObj
                : [locationObj.village, locationObj.ward, locationObj.subCounty]
                    .filter(Boolean)
                    .join(", ");

        res.status(200).json({
            success: true,
            data: {
                ...schedule.toObject(),
                location: locationLabel || "N/A",
            }
        });
    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Get Field Reports
 * @route GET /api/health-worker/reports
 */
export const getFieldReports = async (req, res) => {
    try {
        const chwId = req.user.id;
        const reports = await FieldReport.find({ healthWorker: chwId })
            .sort({ reportDate: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Create Field Report
 * @route POST /api/health-worker/reports
 */
export const createFieldReport = async (req, res) => {
    try {
        const chwId = req.user.id;
        const reportData = req.body;

        const report = await FieldReport.create({
            healthWorker: chwId,
            ...reportData
        });

        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Record Vaccination
 * @route POST /api/health-worker/vaccination
 */
export const recordVaccination = async (req, res) => {
    try {
        const chwId = req.user.id;
        const { childId, vaccineId, doseSequence, dateGiven, batchNumber, nextDueDate } = req.body;

        // 1. Create Vaccination Record
        const record = await VaccinationRecord.create({
            child: childId,
            vaccine: vaccineId,
            doseSequence,
            dateGiven,
            givenBy: chwId,
            batchNumber,
            nextDueDate,
            status: "completed"
        });

        // 2. Update Child Status if needed
        // For simplicity, we just mark as active or check if up-to-date
        // Ideally we re-evaluate full status.

        res.status(201).json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error("Error recording vaccination:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
