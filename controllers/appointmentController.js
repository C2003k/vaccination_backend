import Appointment from "../models/Appointment.js";
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import Child from "../models/Child.js";

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
            query.status = status;
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
            status: apt.status,
            contact: apt.mother ? apt.mother.phone : "N/A",
            type: apt.type
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
        const { childId, vaccineId, date, time, type, notes } = req.body;

        // Validation
        if (!childId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Child, Date and Time are required"
            });
        }

        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: "Child not found"
            });
        }

        const newAppointment = await Appointment.create({
            hospital: hospitalId,
            child: childId,
            mother: child.parent || req.user.id, // Assuming parent is linked to child or creator
            vaccine: vaccineId,
            scheduledDate: new Date(date),
            scheduledTime: time,
            type: type || 'vaccination',
            status: 'scheduled',
            notes
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
        const { appointmentId } = req.params;
        const updateData = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
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
        const { appointmentId } = req.params;
        const { status } = req.body;

        if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
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
        const { appointmentId } = req.params;

        const appointment = await Appointment.findByIdAndDelete(appointmentId);

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
