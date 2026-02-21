import Appointment from "../models/Appointment.js";
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import Child from "../models/Child.js";
import Vaccine from "../models/Vaccine.js";

// Get appointments with filters
export const getAppointments = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { date, status, search } = req.query;

        const query = { hospital: hospitalId };

        if (date) {
            // Filter by specific date (ignore time)
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.scheduledDate = { $gte: startDate, $lte: endDate };
        }

        if (status && status !== 'all') {
            query.status = status === "no-show" ? "no_show" : status;
        }

        let appointments = await Appointment.find(query)
            .populate("child", "name dateOfBirth gender parent")
            .populate("mother", "name phone email")
            .populate("vaccine", "name")
            .sort({ scheduledDate: 1 });

        if (search) {
            const searchLower = search.toLowerCase();
            appointments = appointments.filter(apt =>
                (apt.child && apt.child.name.toLowerCase().includes(searchLower)) ||
                (apt.mother && apt.mother.name.toLowerCase().includes(searchLower))
            );
        }

        // Format for frontend
        const formattedAppointments = appointments.map(apt => ({
            _id: apt._id,
            childName: apt.child ? apt.child.name : "Unknown",
            parentName: apt.mother ? apt.mother.name : "Unknown",
            vaccine: apt.vaccine ? apt.vaccine.name : "Consultation",
            age: apt.child ? calculateAge(apt.child.dateOfBirth) : "N/A",
            date: apt.scheduledDate,
            time: apt.scheduledTime,
            status: apt.status === "no_show" ? "no-show" : apt.status,
            contact: apt.mother ? apt.mother.phone : "N/A",
            type: apt.type,
            notes: apt.notes,
        }));

        res.status(200).json({
            success: true,
            count: formattedAppointments.length,
            data: formattedAppointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new appointment
export const createAppointment = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const {
            childId,
            childName,
            parentName,
            vaccineId,
            vaccine,
            date,
            time,
            type,
            duration,
            notes,
            status,
        } = req.body;

        // Validation
        if ((!childId && !childName) || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Child, Date and Time are required"
            });
        }

        let child = null;
        if (childId) {
            child = await Child.findById(childId);
        } else {
            const childQuery = { name: { $regex: `^${childName}$`, $options: "i" } };
            child = await Child.findOne(childQuery).populate("parent");

            if (!child && parentName) {
                const parent = await User.findOne({
                    name: { $regex: `^${parentName}$`, $options: "i" },
                    role: "mother",
                });
                if (parent) {
                    child = await Child.findOne({
                        parent: parent._id,
                        name: { $regex: `^${childName}$`, $options: "i" },
                    });
                }
            }
        }

        if (!child) {
            return res.status(404).json({
                success: false,
                message: "Child not found"
            });
        }

        let resolvedVaccineId = vaccineId;
        if (!resolvedVaccineId && vaccine) {
            const normalizedCode = vaccine.replace(/\s+/g, "").toUpperCase();
            const vaccineDoc = await Vaccine.findOne({
                $or: [
                    { name: { $regex: `^${escapeRegex(vaccine)}$`, $options: "i" } },
                    { code: normalizedCode },
                ],
            });
            resolvedVaccineId = vaccineDoc?._id;
        }

        if (!resolvedVaccineId) {
            return res.status(400).json({
                success: false,
                message: "Valid vaccine is required",
            });
        }

        const newAppointment = await Appointment.create({
            hospital: hospitalId,
            child: child._id,
            mother: child.parent || req.user.id, // Assuming parent is linked to child or creator
            vaccine: resolvedVaccineId,
            scheduledDate: new Date(date),
            scheduledTime: time,
            type: type || 'vaccination',
            status: status === "no-show" ? "no_show" : status || "scheduled",
            duration: duration || 30,
            notes,
        });

        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: newAppointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update appointment
export const updateAppointment = async (req, res) => {
    try {
        const { hospitalId, appointmentId } = req.params;
        const updateData = { ...req.body };
        if (updateData.status === "no-show") {
            updateData.status = "no_show";
        }
        if (updateData.date) {
            updateData.scheduledDate = new Date(updateData.date);
            delete updateData.date;
        }
        if (updateData.time) {
            updateData.scheduledTime = updateData.time;
            delete updateData.time;
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, hospital: hospitalId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { hospitalId, appointmentId } = req.params;
        let { status } = req.body;
        if (status === "no-show") status = "no_show";

        if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, hospital: hospitalId },
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Appointment marked as ${status}`,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
    try {
        const { hospitalId, appointmentId } = req.params;

        const appointment = await Appointment.findOneAndDelete({ _id: appointmentId, hospital: hospitalId });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper: Calculate age from DOB
const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age === 0) {
        const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        return `${months} months`;
    }
    return `${age} years`;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
