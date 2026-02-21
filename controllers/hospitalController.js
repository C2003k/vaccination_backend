import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalsByCounty,
  getHospitalDashboard,
  linkHospitalStaff,
  unlinkHospitalStaff,
  getEligibleHealthWorkers,
  getEligibleMothers,
  assignMotherToHealthWorker,
} from "../services/HospitalService.js";
import Appointment from "../models/Appointment.js";
import Child from "../models/Child.js";
import Vaccine from "../models/Vaccine.js";

export const getHospitals = async (req, res) => {
  try {
    const { county, type, status, name, facilityLevel } = req.query;
    const filters = {};

    if (county) filters["location.county"] = county;
    if (type) filters.type = type;
    if (facilityLevel) filters.facilityLevel = facilityLevel;
    if (name) filters.name = { $regex: name, $options: "i" };
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

export const linkHospitalStaffHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const result = await linkHospitalStaff(hospitalId, userId);
    res.status(200).json({
      success: true,
      message: "Hospital staff linked successfully",
      data: result,
    });
  } catch (error) {
    let status = 500;
    if (error.message.includes("not found")) status = 404;
    if (error.message.includes("not hospital staff")) status = 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const unlinkHospitalStaffHandler = async (req, res) => {
  try {
    const { hospitalId, userId } = req.params;

    const result = await unlinkHospitalStaff(hospitalId, userId);
    res.status(200).json({
      success: true,
      message: "Hospital staff unlinked successfully",
      data: result,
    });
  } catch (error) {
    let status = 500;
    if (error.message.includes("not found")) status = 404;
    if (error.message.includes("not hospital staff")) status = 400;
    if (error.message.includes("not linked")) status = 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getEligibleHealthWorkersHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { search } = req.query;

    const healthWorkers = await getEligibleHealthWorkers(hospitalId, { search });
    res.status(200).json({
      success: true,
      count: healthWorkers.length,
      data: healthWorkers,
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getEligibleMothersHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { search, assigned } = req.query;

    const mothers = await getEligibleMothers(hospitalId, { search, assigned });
    res.status(200).json({
      success: true,
      count: mothers.length,
      data: mothers,
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const assignMotherToHealthWorkerHandler = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { motherId, healthWorkerId } = req.body;

    if (!motherId || !healthWorkerId) {
      return res.status(400).json({
        success: false,
        message: "Mother ID and Health Worker ID are required",
      });
    }

    const result = await assignMotherToHealthWorker(
      hospitalId,
      motherId,
      healthWorkerId
    );

    res.status(200).json({
      success: true,
      message: "Mother assigned to health worker successfully",
      data: result,
    });
  } catch (error) {
    let status = 500;
    if (error.message.includes("not found")) status = 404;
    if (error.message.includes("not a mother")) status = 400;
    if (error.message.includes("not a health worker")) status = 400;
    res.status(status).json({ success: false, message: error.message });
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

    const patientsRaw = await Promise.all(children.map(async (child) => {
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

      const allAppointments = await Appointment.find({
        hospital: hospitalId,
        child: child._id,
      }).populate("vaccine", "name");

      const noShowAppointments = await Appointment.countDocuments({
        hospital: hospitalId,
        child: child._id,
        status: "no_show",
      });
      const pendingPastAppointments = await Appointment.countDocuments({
        hospital: hospitalId,
        child: child._id,
        status: { $in: ["scheduled", "confirmed"] },
        scheduledDate: { $lt: new Date() },
      });

      let computedStatus = "up-to-date";
      if (pendingPastAppointments > 0) computedStatus = "overdue";
      else if (noShowAppointments > 0) computedStatus = "defaulting";

      const displayStatus =
        child.vaccinationStatus === "behind" ? "defaulting" :
        child.vaccinationStatus === "not-started" ? computedStatus :
        "up-to-date";

      return {
        _id: child._id,
        childName: child.name,
        age: child.ageInMonths + " months",
        ageInMonths: child.ageInMonths,
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        parentName: child.parent?.name || "Unknown",
        contact: child.parent?.phone || "N/A",
        status: displayStatus,
        lastVisit: lastAppointment?.scheduledDate,
        nextVisit: nextAppointment?.scheduledDate,
        vaccines: allAppointments.map((a) => ({
          name: a.vaccine?.name || "Scheduled Vaccine",
          status: a.status,
          date: a.scheduledDate,
        })),
      };
    }));

    const patients = patientsRaw.filter((patient) => {
      if (status && patient.status !== status) return false;
      if (ageGroup === "infant" && patient.ageInMonths > 12) return false;
      if (ageGroup === "toddler" && (patient.ageInMonths <= 12 || patient.ageInMonths > 36)) {
        return false;
      }
      return true;
    });

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
    const { patientId } = req.params;
    const child = await Child.findById(patientId).populate("parent");

    if (!child) return res.status(404).json({ success: false, message: "Patient not found" });

    const appointments = await Appointment.find({ child: patientId })
      .populate("vaccine")
      .sort({ scheduledDate: 1 });

    const data = {
      _id: child._id,
      childName: child.name,
      dateOfBirth: child.dateOfBirth,
      age: child.ageInMonths + " months",
      gender: child.gender,
      parentName: child.parent?.name || "Unknown",
      contact: child.parent?.phone || "N/A",
      email: child.parent?.email,
      address: child.parent?.location,
      status: child.vaccinationStatus === "behind" ? "defaulting" : "up-to-date",
      vaccines: appointments.map((appointment) => ({
        name: appointment.vaccine?.name || "Vaccine",
        status:
          appointment.status === "no_show"
            ? "overdue"
            : appointment.status === "completed"
              ? "completed"
              : "scheduled",
        date: appointment.scheduledDate,
      })),
      appointments,
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

    const startDate = new Date();
    if (dateRange === "7days") startDate.setDate(startDate.getDate() - 7);
    else if (dateRange === "90days") startDate.setDate(startDate.getDate() - 90);
    else if (dateRange === "1year") startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setDate(startDate.getDate() - 30);

    let vaccineQuery = { isActive: true };
    if (vaccine && vaccine !== "all") {
      vaccineQuery = {
        ...vaccineQuery,
        name: { $regex: vaccine, $options: "i" },
      };
    }
    const allVaccines = await Vaccine.find(vaccineQuery);

    const uniqueChildren = await Appointment.distinct("child", { hospital: hospitalId });
    const eligibleChildren = uniqueChildren.length || 1;
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - Math.max(7, Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))));

    const coverageByVaccine = await Promise.all(
      allVaccines.map(async (v) => {
        const completedInRange = await Appointment.countDocuments({
          hospital: hospitalId,
          vaccine: v._id,
          status: "completed",
          scheduledDate: { $gte: startDate, $lte: new Date() },
        });

        const completedPreviousRange = await Appointment.countDocuments({
          hospital: hospitalId,
          vaccine: v._id,
          status: "completed",
          scheduledDate: { $gte: previousStartDate, $lt: startDate },
        });

        const coverage = Math.min(100, Math.round((completedInRange / eligibleChildren) * 100));
        const trend = completedInRange > completedPreviousRange ? "up" :
          completedInRange < completedPreviousRange ? "down" : "stable";

        return {
          vaccine: v.name,
          coverage,
          target: 90,
          trend,
        };
      })
    );

    const achievedTargets = coverageByVaccine.filter((v) => v.coverage >= v.target).length;
    const achievementRate = coverageByVaccine.length
      ? Math.round((achievedTargets / coverageByVaccine.length) * 100)
      : 0;
    const noShowCount = await Appointment.countDocuments({
      hospital: hospitalId,
      status: "no_show",
      scheduledDate: { $gte: startDate, $lte: new Date() },
    });
    const completedCount = await Appointment.countDocuments({
      hospital: hospitalId,
      status: "completed",
      scheduledDate: { $gte: startDate, $lte: new Date() },
    });
    const defaultersRate = completedCount + noShowCount > 0
      ? Math.round((noShowCount / (completedCount + noShowCount)) * 100)
      : 0;

    const metrics = [
      { metric: "Monthly Growth", value: `${Math.max(0, achievementRate - 50)}%`, trend: "up" },
      { metric: "Target Achievement", value: `${achievementRate}%`, trend: achievementRate >= 70 ? "up" : "stable" },
      { metric: "Defaulters Rate", value: `${defaultersRate}%`, trend: defaultersRate <= 10 ? "down" : "stable" },
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
