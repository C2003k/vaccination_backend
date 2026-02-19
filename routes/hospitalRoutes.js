import express from "express";
import {
    getHospitals,
    getHospital,
    createHospitalHandler,
    updateHospitalHandler,
    deleteHospitalHandler,
    getHospitalDashboardHandler,
    getFacilityInfoHandler,
    updateFacilityInfoHandler,
    getPatientsHandler,
    getPatientDetailHandler,
    getCoverageReportsHandler,
} from "../controllers/hospitalController.js";
import {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus
} from "../controllers/appointmentController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

// Apply JWT verification to all hospital routes
router.use(verifyJWT);

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals with optional filtering
 * @access  Private - Admin, Hospital Staff, Health Worker
 */
router.get(
    "/",
    verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, "hospital_staff"),
    getHospitals
);

/**
 * @route   GET /api/hospitals/search
 * @desc    Search hospitals by name, county, or type
 * @access  Private - Admin, Hospital Staff, Health Worker
 */
router.get(
    "/search",
    verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, "hospital_staff"),
    async (req, res) => {
        try {
            const { name, county, type, facilityLevel } = req.query;
            const filters = {};

            if (name) filters.name = { $regex: name, $options: "i" };
            if (county)
                filters["location.county"] = { $regex: county, $options: "i" };
            if (type) filters.type = type;
            if (facilityLevel) filters.facilityLevel = facilityLevel;
            filters.isActive = true;

            const hospitals = await getAllHospitals(filters);

            res.status(200).json({
                success: true,
                count: hospitals.length,
                data: hospitals,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   GET /api/hospitals/county/:county
 * @desc    Get hospitals by county
 * @access  Private - Admin, Hospital Staff, Health Worker
 */
router.get(
    "/county/:county",
    verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, "hospital_staff"),
    async (req, res) => {
        try {
            const { county } = req.params;
            const hospitals = await getHospitalsByCounty(county);

            res.status(200).json({
                success: true,
                count: hospitals.length,
                data: hospitals,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   GET /api/hospitals/nearby
 * @desc    Get hospitals near a location (by coordinates)
 * @access  Private - Admin, Hospital Staff, Health Worker, Mother
 */
router.get(
    "/nearby",
    verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, "hospital_staff", ROLES.MOTHER),
    async (req, res) => {
        try {
            const { lat, lng, maxDistance = 5000 } = req.query; // maxDistance in meters, default 5km

            if (!lat || !lng) {
                return res.status(400).json({
                    success: false,
                    message: "Latitude and longitude are required",
                });
            }

            const hospitals = await findNearbyHospitals(
                parseFloat(lat),
                parseFloat(lng),
                parseInt(maxDistance)
            );

            res.status(200).json({
                success: true,
                count: hospitals.length,
                data: hospitals,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get hospital by ID
 * @access  Private - Admin, Hospital Staff, Health Worker, Mother (for appointment booking)
 */
router.get(
    "/:id",
    verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, "hospital_staff", ROLES.MOTHER),
    getHospital
);

/**
 * @route   GET /api/hospitals/:id/dashboard
 * @desc    Get hospital dashboard with statistics
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.get(
    "/:id/dashboard",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Check if hospital staff is accessing their own hospital
            if (userRole === "hospital_staff") {
                const userHospital = await getUserHospital(userId);
                if (!userHospital || userHospital._id.toString() !== hospitalId) {
                    return res.status(403).json({
                        success: false,
                        message: "Not authorized to access this hospital dashboard",
                    });
                }
            }

            const dashboard = await getHospitalDashboardHandler(req, res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    getHospitalDashboardHandler
);

/**
 * @route   GET /api/hospitals/:id/statistics
 * @desc    Get hospital statistics (vaccinations, coverage, etc.)
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.get(
    "/:id/statistics",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const { period = "monthly", startDate, endDate } = req.query;

            const statistics = await getHospitalStatistics(
                hospitalId,
                period,
                startDate,
                endDate
            );

            res.status(200).json({
                success: true,
                data: statistics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   GET /api/hospitals/:id/staff
 * @desc    Get hospital staff members
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.get(
    "/:id/staff",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const staff = await getHospitalStaff(hospitalId);

            res.status(200).json({
                success: true,
                count: staff.length,
                data: staff,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   GET /api/hospitals/:id/stock-summary
 * @desc    Get hospital vaccine stock summary
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.get(
    "/:id/stock-summary",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const summary = await getStockSummary(hospitalId);

            res.status(200).json({
                success: true,
                data: summary,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   POST /api/hospitals
 * @desc    Create new hospital
 * @access  Private - Admin only
 */
router.post("/", verifyRoles(ROLES.ADMIN), createHospitalHandler);

/**
 * @route   POST /api/hospitals/:id/admins
 * @desc    Add admin to hospital
 * @access  Private - Admin only
 */
router.post("/:id/admins", verifyRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const hospitalId = req.params.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const hospital = await addAdminToHospital(hospitalId, userId);

        res.status(200).json({
            success: true,
            message: "Admin added to hospital successfully",
            data: hospital,
        });
    } catch (error) {
        if (error.message.includes("not found")) {
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
});

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Update hospital information
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.put(
    "/:id",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Check if hospital staff is updating their own hospital
            if (userRole === "hospital_staff") {
                const userHospital = await getUserHospital(userId);
                if (!userHospital || userHospital._id.toString() !== hospitalId) {
                    return res.status(403).json({
                        success: false,
                        message: "Not authorized to update this hospital",
                    });
                }
            }

            await updateHospitalHandler(req, res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

/**
 * @route   PUT /api/hospitals/:id/coverage
 * @desc    Update hospital coverage data
 * @access  Private - Admin, Hospital Staff (only for their hospital)
 */
router.put(
    "/:id/coverage",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    async (req, res) => {
        try {
            const hospitalId = req.params.id;
            const { current, target } = req.body;

            if (current === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Current coverage rate is required",
                });
            }

            const hospital = await updateHospitalCoverage(hospitalId, {
                current: parseFloat(current),
                target: target ? parseFloat(target) : 90,
            });

            res.status(200).json({
                success: true,
                message: "Coverage updated successfully",
                data: hospital,
            });
        } catch (error) {
            if (error.message === "Hospital not found") {
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
    }
);

/**
 * @route   DELETE /api/hospitals/:id
 * @desc    Delete hospital
 * @access  Private - Admin only
 */
router.delete("/:id", verifyRoles(ROLES.ADMIN), deleteHospitalHandler);

/**
 * @route   DELETE /api/hospitals/:id/admins/:userId
 * @desc    Remove admin from hospital
 * @access  Private - Admin only
 */
router.delete(
    "/:id/admins/:userId",
    verifyRoles(ROLES.ADMIN),
    async (req, res) => {
        try {
            const { id: hospitalId, userId } = req.params;

            const hospital = await removeAdminFromHospital(hospitalId, userId);

            res.status(200).json({
                success: true,
                message: "Admin removed from hospital successfully",
                data: hospital,
            });
        } catch (error) {
            if (error.message.includes("not found")) {
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
    }
);

/**
 * @route   PATCH /api/hospitals/:id/activate
 * @desc    Activate hospital
 * @access  Private - Admin only
 */
router.patch("/:id/activate", verifyRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const hospital = await updateHospital(req.params.id, { isActive: true });

        res.status(200).json({
            success: true,
            message: "Hospital activated successfully",
            data: hospital,
        });
    } catch (error) {
        if (error.message === "Hospital not found") {
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
});

/**
 * @route   PATCH /api/hospitals/:id/deactivate
 * @desc    Deactivate hospital
 * @access  Private - Admin only
 */
router.patch("/:id/deactivate", verifyRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const hospital = await updateHospital(req.params.id, { isActive: false });

        res.status(200).json({
            success: true,
            message: "Hospital deactivated successfully",
            data: hospital,
        });
    } catch (error) {
        if (error.message === "Hospital not found") {
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
});

/**
 * @route   GET /api/hospitals/statistics/summary
 * @desc    Get system-wide hospital statistics
 * @access  Private - Admin only
 */
router.get(
    "/statistics/summary",
    verifyRoles(ROLES.ADMIN),
    async (req, res) => {
        try {
            const summary = await getHospitalSystemSummary();

            res.status(200).json({
                success: true,
                data: summary,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

// Import required services and repository functions
import {
    getAllHospitals,
    getHospitalsByCounty,
    getHospitalById,
    updateHospital,
    updateHospitalCoverage,
    addAdminToHospital,
    removeAdminFromHospital,
    findNearbyHospitals,
    getHospitalStatistics,
    getHospitalSystemSummary,
    getHospitalStaff,
    getUserHospital,
} from "../services/HospitalService.js";
import { getStockSummary } from "../services/VaccineStockService.js";

// Appointment Routes

/**
 * @route   GET /api/hospitals/:hospitalId/appointments
 * @desc    Get hospital appointments
 * @access  Private - Admin, Hospital Staff
 */
router.get(
    "/:hospitalId/appointments",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    getAppointments
);

/**
 * @route   POST /api/hospitals/:hospitalId/appointments
 * @desc    Create new appointment
 * @access  Private - Admin, Hospital Staff
 */
router.post(
    "/:hospitalId/appointments",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    createAppointment
);

/**
 * @route   PUT /api/hospitals/:hospitalId/appointments/:appointmentId
 * @desc    Update appointment
 * @access  Private - Admin, Hospital Staff
 */
router.put(
    "/:hospitalId/appointments/:appointmentId",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    updateAppointment
);

/**
 * @route   DELETE /api/hospitals/:hospitalId/appointments/:appointmentId
 * @desc    Delete appointment
 * @access  Private - Admin, Hospital Staff
 */
router.delete(
    "/:hospitalId/appointments/:appointmentId",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    deleteAppointment
);

/**
 * @route   PATCH /api/hospitals/:hospitalId/appointments/:appointmentId/status
 * @desc    Update appointment status
 * @access  Private - Admin, Hospital Staff
 */
router.patch(
    "/:hospitalId/appointments/:appointmentId/status",
    verifyRoles(ROLES.ADMIN, "hospital_staff"),
    updateAppointmentStatus
);

// Facility Management
router.get("/:hospitalId/facility", getFacilityInfoHandler);
router.put("/:hospitalId/facility", updateFacilityInfoHandler);

// Patient Records
router.get("/:hospitalId/patients", getPatientsHandler);
router.get("/:hospitalId/patients/:patientId", getPatientDetailHandler);

// Coverage Reports
router.get("/:hospitalId/coverage-reports", getCoverageReportsHandler);

export default router;
