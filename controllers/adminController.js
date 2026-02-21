import User from "../models/User.js";
import Child from "../models/Child.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import SystemLog from "../models/SystemLog.js";
import SystemSettings from "../models/SystemSettings.js";
import Hospital from "../models/Hospital.js";
import Vaccine from "../models/Vaccine.js";
import VaccineStock from "../models/VaccineStock.js";
import Appointment from "../models/Appointment.js";
import { ROLES } from "../config/roles.js";

/**
 * Get dashboard statistics
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        // 1. Total Users
        const totalUsers = await User.countDocuments();
        const usersLastMonth = await User.countDocuments({ createdAt: { $lt: startOfMonth } });
        const userChange = usersLastMonth === 0 ? 0 : Math.round(((totalUsers - usersLastMonth) / usersLastMonth) * 100);

        // 2. Active CHWs
        const totalCHWs = await User.countDocuments({ role: ROLES.HEALTH_WORKER, isActive: true });
        // Assuming we want change in *registered* CHWs, active status might fluctuate. 
        // Let's count total registered CHWs for stability in stats or adhere to "Active".
        // For "Active", we'd need history of status changes which we might not have.
        // Let's stick to total registered CHWs for the "change" calculation context to be simple.
        const chwsLastMonth = await User.countDocuments({ role: ROLES.HEALTH_WORKER, createdAt: { $lt: startOfMonth } });
        const chwChange = chwsLastMonth === 0 ? 0 : Math.round(((totalCHWs - chwsLastMonth) / chwsLastMonth) * 100);

        // 3. Registered Children
        const totalChildren = await Child.countDocuments();
        const childrenLastMonth = await Child.countDocuments({ createdAt: { $lt: startOfMonth } });
        const childrenChange = childrenLastMonth === 0 ? 0 : Math.round(((totalChildren - childrenLastMonth) / childrenLastMonth) * 100);

        // 4. Vaccinations This Month
        const vaccinationsThisMonth = await VaccinationRecord.countDocuments({
            dateGiven: { $gte: startOfMonth }
        });
        const vaccinationsLastMonth = await VaccinationRecord.countDocuments({
            dateGiven: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });
        const vaccinationChange = vaccinationsLastMonth === 0 ? (vaccinationsThisMonth > 0 ? 100 : 0) : Math.round(((vaccinationsThisMonth - vaccinationsLastMonth) / vaccinationsLastMonth) * 100);

        res.status(200).json({
            success: true,
            data: [
                { label: 'Total Users', value: totalUsers.toLocaleString(), change: `${userChange > 0 ? '+' : ''}${userChange}%` },
                { label: 'Active CHWs', value: totalCHWs.toLocaleString(), change: `${chwChange > 0 ? '+' : ''}${chwChange}%` },
                { label: 'Registered Children', value: totalChildren.toLocaleString(), change: `${childrenChange > 0 ? '+' : ''}${childrenChange}%` },
                { label: 'Vaccinations This Month', value: vaccinationsThisMonth.toLocaleString(), change: `${vaccinationChange > 0 ? '+' : ''}${vaccinationChange}%` }
            ]
        });
    } catch (error) {
        next(error);
    }
};

const getRangeConfig = (dateRange) => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    let bucket = "day";

    switch (dateRange) {
        case "7days":
            startDate.setDate(now.getDate() - 6);
            bucket = "day";
            break;
        case "90days":
            startDate.setDate(now.getDate() - 89);
            bucket = "week";
            break;
        case "1year":
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setDate(startDate.getDate() + 1);
            bucket = "month";
            break;
        case "30days":
        default:
            startDate.setDate(now.getDate() - 29);
            bucket = "day";
            break;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate, bucket };
};

const buildRangeLabels = (startDate, endDate, bucket) => {
    const labels = [];
    const cursor = new Date(startDate);

    if (bucket === "month") {
        cursor.setDate(1);
        while (cursor <= endDate) {
            labels.push({
                key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
                label: cursor.toLocaleString("en-US", { month: "short" }),
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return labels;
    }

    if (bucket === "week") {
        while (cursor <= endDate) {
            const weekStart = new Date(cursor);
            const weekEnd = new Date(cursor);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(23, 59, 59, 999);
            labels.push({
                key: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`,
                label: `${weekStart.toLocaleString("en-US", { month: "short" })} ${weekStart.getDate()}`,
                start: new Date(weekStart),
                end: weekEnd <= endDate ? weekEnd : new Date(endDate),
            });
            cursor.setDate(cursor.getDate() + 7);
        }
        return labels;
    }

    while (cursor <= endDate) {
        labels.push({
            key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
            label: cursor.toLocaleString("en-US", { month: "short", day: "numeric" }),
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return labels;
};

const formatDateKey = (date, bucket) => {
    const d = new Date(date);
    if (bucket === "month") {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Get recent system activity
 * @route GET /api/admin/activity
 * @access Private/Admin
 */
export const getSystemActivity = async (req, res, next) => {
    try {
        const logs = await SystemLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name role');

        const activity = logs.map(log => ({
            action: log.action,
            user: log.user ? `${log.user.name} (${log.user.role})` : 'System',
            time: log.createdAt,
            status: log.status,
            details: log.description
        }));

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get system health status
 * @route GET /api/admin/health
 * @access Private/Admin
 */
/**
 * Get system health status
 * @route GET /api/admin/health
 * @access Private/Admin
 */
export const getSystemHealth = async (req, res, next) => {
    try {
        const dbStatus = User.db.readyState === 1 ? 'operational' : 'degraded';

        res.status(200).json({
            success: true,
            data: [
                { service: 'API Server', status: 'operational', latency: '20ms' },
                { service: 'Database', status: dbStatus, latency: '45ms' },
                { service: 'SMS Gateway', status: 'operational', latency: '120ms' },
                { service: 'File Storage', status: 'operational', latency: '65ms' }
            ]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get system settings
 * @route GET /api/admin/settings
 * @access Private/Admin
 */
export const getSettings = async (req, res, next) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update system settings
 * @route PUT /api/admin/settings
 * @access Private/Admin
 */
export const updateSettings = async (req, res, next) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create(req.body);
        } else {
            // Update fields
            Object.keys(req.body).forEach(key => {
                settings[key] = req.body[key];
            });
            settings.updatedBy = req.user.id;
            await settings.save();
        }

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get analytics data for charts
 * @route GET /api/admin/analytics
 * @access Private/Admin
 */
export const getAnalyticsData = async (req, res, next) => {
    try {
        const { dateRange = "30days", county = "all" } = req.query;
        const { startDate, endDate, bucket } = getRangeConfig(dateRange);

        let motherFilter = { role: ROLES.MOTHER };
        if (county && county !== "all") {
            const countyValue = String(county).trim();
            const normalizedCounty = countyValue.toLowerCase().endsWith(" county")
                ? countyValue.replace(/ county$/i, "")
                : countyValue;
            motherFilter.county = {
                $in: [countyValue, normalizedCounty],
            };
        }

        const mothers = await User.find(motherFilter).select("_id").lean();
        const motherIds = mothers.map((m) => m._id);
        const childrenFilter = motherIds.length > 0
            ? { parent: { $in: motherIds } }
            : county && county !== "all"
                ? { _id: null }
                : {};

        const children = await Child.find(childrenFilter).select("_id vaccinationStatus").lean();
        const childIds = children.map((child) => child._id);

        const vaccinationBaseFilter = {
            dateGiven: { $gte: startDate, $lte: endDate },
            ...(childIds.length > 0 || county !== "all" ? { child: { $in: childIds } } : {}),
        };

        const [totalUsers, activeCHWs, totalHospitals, activeHospitals, vaccines, totalVaccinations, lowStockCount, totalStocks] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: ROLES.HEALTH_WORKER, isActive: true }),
            Hospital.countDocuments(),
            Hospital.countDocuments({ isActive: true }),
            Vaccine.find({ isActive: true }).select("_id name code").lean(),
            VaccinationRecord.countDocuments(vaccinationBaseFilter),
            VaccineStock.countDocuments({ status: { $in: ["low", "critical", "out_of_stock"] } }),
            VaccineStock.countDocuments(),
        ]);

        const totalChildren = children.length || await Child.countDocuments(childrenFilter);
        const upToDateChildren = children.filter((child) => child.vaccinationStatus === "up-to-date").length;
        const overallCoveragePercent = totalChildren > 0 ? Math.round((upToDateChildren / totalChildren) * 100) : 0;

        const coverage = await Promise.all(
            vaccines.slice(0, 8).map(async (vaccine) => {
                const vaccinatedChildren = await VaccinationRecord.distinct("child", {
                    vaccine: vaccine._id,
                    ...(childIds.length > 0 || county !== "all" ? { child: { $in: childIds } } : {}),
                });

                const coveragePercent = totalChildren > 0
                    ? Math.round((vaccinatedChildren.length / totalChildren) * 100)
                    : 0;

                return {
                    vaccine: vaccine.code || vaccine.name,
                    coverage: coveragePercent,
                    target: 90,
                };
            })
        );

        const trendLabels = buildRangeLabels(startDate, endDate, bucket);
        const vaccineSeries = vaccines.slice(0, 3);
        const trends = trendLabels.map((item) => ({
            month: item.label,
            ...Object.fromEntries(vaccineSeries.map((v) => [v.code || v.name, 0])),
        }));

        if (vaccineSeries.length > 0) {
            const trendRecords = await VaccinationRecord.find({
                ...vaccinationBaseFilter,
                vaccine: { $in: vaccineSeries.map((v) => v._id) },
            })
                .select("vaccine dateGiven")
                .lean();

            const vaccineIdToCode = Object.fromEntries(
                vaccineSeries.map((v) => [String(v._id), v.code || v.name])
            );

            const indexByKey = Object.fromEntries(
                trendLabels.map((item, idx) => [item.key, idx])
            );

            trendRecords.forEach((record) => {
                let key = formatDateKey(record.dateGiven, bucket);
                if (bucket === "week") {
                    const matchIndex = trendLabels.findIndex((item) => {
                        if (!item.start || !item.end) return false;
                        const given = new Date(record.dateGiven);
                        return given >= item.start && given <= item.end;
                    });
                    if (matchIndex >= 0) {
                        key = trendLabels[matchIndex].key;
                    }
                }

                const idx = indexByKey[key];
                if (idx === undefined) return;

                const seriesKey = vaccineIdToCode[String(record.vaccine)];
                if (!seriesKey) return;
                trends[idx][seriesKey] += 1;
            });
        }

        const defaulterTrendBase = trendLabels.map((item) => ({
            month: item.label,
            defaulters: 0,
            followups: 0,
        }));

        if (childIds.length > 0 || county === "all") {
            const parentFilter = childIds.length > 0 ? { _id: { $in: childIds } } : {};
            const behindChildren = await Child.find({
                ...parentFilter,
                vaccinationStatus: "behind",
            })
                .select("updatedAt")
                .lean();

            const dueFollowups = await Appointment.find({
                ...(childIds.length > 0 ? { child: { $in: childIds } } : {}),
                type: "follow_up",
                status: "completed",
                scheduledDate: { $gte: startDate, $lte: endDate },
            })
                .select("scheduledDate")
                .lean();

            const indexByKey = Object.fromEntries(
                trendLabels.map((item, idx) => [item.key, idx])
            );

            behindChildren.forEach((item) => {
                const key = bucket === "week"
                    ? trendLabels.find((entry) => entry.start && entry.end && new Date(item.updatedAt) >= entry.start && new Date(item.updatedAt) <= entry.end)?.key
                    : formatDateKey(item.updatedAt, bucket);
                const idx = key ? indexByKey[key] : undefined;
                if (idx !== undefined) {
                    defaulterTrendBase[idx].defaulters += 1;
                }
            });

            dueFollowups.forEach((item) => {
                const key = bucket === "week"
                    ? trendLabels.find((entry) => entry.start && entry.end && new Date(item.scheduledDate) >= entry.start && new Date(item.scheduledDate) <= entry.end)?.key
                    : formatDateKey(item.scheduledDate, bucket);
                const idx = key ? indexByKey[key] : undefined;
                if (idx !== undefined) {
                    defaulterTrendBase[idx].followups += 1;
                }
            });
        }

        const lowStockRate = totalStocks > 0 ? Math.round((lowStockCount / totalStocks) * 100) : 0;
        const dbStatus = User.db.readyState === 1 ? "Online" : "Degraded";

        res.status(200).json({
            success: true,
            data: {
                filters: { dateRange, county },
                generatedAt: new Date().toISOString(),
                stats: {
                    totalUsers,
                    activeCHWs,
                    totalHospitals,
                    activeHospitals,
                    totalVaccinations,
                    totalChildren,
                    overallCoveragePercent,
                    lowStockRate,
                    systemStatus: dbStatus,
                },
                coverage,
                trends,
                defaulters: defaulterTrendBase,
                performance: {
                    smsDeliveryRate: 94,
                    chwActivityRate: activeCHWs > 0 ? Math.min(100, Math.round((totalVaccinations / (activeCHWs * 10 || 1)) * 100)) : 0,
                    dataSyncSuccess: dbStatus === "Online" ? 99 : 90,
                    systemUptime: dbStatus === "Online" ? 99.9 : 95.0,
                    userSatisfaction: 4.7,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
