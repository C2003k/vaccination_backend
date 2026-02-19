import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalsByCounty,
  getHospitalDashboard,
} from "../services/HospitalService.js";
import Appointment from "../models/Appointment.js";
import Child from "../models/Child.js";
import Vaccine from "../models/Vaccine.js";

export const getHospitals = async (req, res) => {
  try {
    const { county, type, status } = req.query;
    const filters = {};

    if (county) filters["location.county"] = county;
    if (type) filters.type = type;
    if (status) filters.isActive = status === "active";

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
};

export const getHospital = async (req, res) => {
  try {
    const hospital = await getHospitalById(req.params.id);

    res.status(200).json({
      success: true,
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
};

export const createHospitalHandler = async (req, res) => {
  try {
    const hospital = await createHospital(req.body);

    res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: hospital,
    });
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("Phone must be")
    ) {
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

export const updateHospitalHandler = async (req, res) => {
  try {
    const hospital = await updateHospital(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
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
};

export const deleteHospitalHandler = async (req, res) => {
  try {
    const result = await deleteHospital(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
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
};

export const getHospitalDashboardHandler = async (req, res) => {
  try {
    const dashboard = await getHospitalDashboard(req.params.id);

    res.status(200).json({
      success: true,
      data: dashboard,
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
};

export const getFacilityInfoHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await getHospitalById(hospitalId);

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    // Calculate dynamic stats
    const totalChildren = await Appointment.distinct("child", { hospital: hospitalId });

    // Count monthly vaccinations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyVaccinations = await Appointment.countDocuments({
      hospital: hospitalId,
      status: "completed",
      scheduledDate: { $gte: startOfMonth }
    });

    const facilityData = hospital.toObject();
    facilityData.stats = {
      ...facilityData.stats,
      totalChildren: totalChildren.length,
      monthlyVaccinations,
      activeStaff: facilityData.staff?.total || 0,
      coverage: facilityData.coverage?.current || 0
    };

    res.status(200).json({
      success: true,
      data: facilityData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFacilityInfoHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await updateHospital(hospitalId, req.body);
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientsHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { status, ageGroup, search } = req.query;

    const childIds = await Appointment.distinct("child", { hospital: hospitalId });

    let query = { _id: { $in: childIds } };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    let children = await Child.find(query).populate("parent", "name phone email");

    const patients = await Promise.all(children.map(async (child) => {
      const lastAppointment = await Appointment.findOne({
        hospital: hospitalId,
        child: child._id,
        status: "completed"
      }).sort({ scheduledDate: -1 });

      const nextAppointment = await Appointment.findOne({
        hospital: hospitalId,
        child: child._id,
        status: { $in: ["scheduled", "pending"] },
        scheduledDate: { $gte: new Date() }
      }).sort({ scheduledDate: 1 });

      const allAppointments = await Appointment.find({ child: child._id });

      let computedStatus = "up-to-date";
      const missedAppointments = await Appointment.countDocuments({
        hospital: hospitalId,
        child: child._id,
        status: "missed"
      });

      if (missedAppointments > 0) computedStatus = "defaulting";

      return {
        _id: child._id,
        childName: child.name,
        age: child.ageInMonths + " months",
        gender: child.gender,
        parentName: child.parent?.name || "Unknown",
        contact: child.parent?.phone || "N/A",
        status: child.vaccinationStatus || computedStatus,
        lastVisit: lastAppointment?.scheduledDate,
        nextVisit: nextAppointment?.scheduledDate,
        vaccines: allAppointments.map(a => ({ status: a.status }))
      };
    }));

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientDetailHandler = async (req, res) => {
  try {
    const { hospitalId, patientId } = req.params;
    const child = await Child.findById(patientId).populate("parent");

    if (!child) return res.status(404).json({ success: false, message: "Patient not found" });

    const appointments = await Appointment.find({ child: patientId })
      .populate("vaccine")
      .sort({ scheduledDate: 1 });

    const data = {
      ...child.toObject(),
      age: child.ageInMonths + " months",
      appointments
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoverageReportsHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { dateRange, vaccine } = req.query;

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    if (dateRange === '7days') startDate.setDate(new Date().getDate() - 7);
    if (dateRange === '90days') startDate.setDate(new Date().getDate() - 90);
    if (dateRange === '1year') startDate.setFullYear(new Date().getFullYear() - 1);

    const allVaccines = await Vaccine.find({ isActive: true });

    // Simple mock logic for now to ensure it returns data
    // In production, this would be a complex aggregation
    const coverageByVaccine = await Promise.all(allVaccines.map(async (v) => {
      return {
        vaccine: v.name,
        coverage: Math.floor(Math.random() * 30) + 60, // Mock 60-90%
        target: 90,
        trend: Math.random() > 0.5 ? 'up' : 'stable'
      };
    }));

    const metrics = [
      { metric: 'Monthly Growth', value: '+2.5%', trend: 'up' },
      { metric: 'Target Achievement', value: '78%', trend: 'up' },
      { metric: 'Defaulters Rate', value: '5%', trend: 'down' }
    ];

    res.status(200).json({
      success: true,
      data: {
        coverageByVaccine,
        metrics
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
