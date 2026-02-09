import {
  findAllCoverageReports,
  findCoverageReportById,
  findReportsByHospitalId,
  createNewCoverageReport,
  updateExistingCoverageReport,
} from "../repositories/CoverageReportRepository.js";
import { findHospitalById } from "../repositories/HospitalRepository.js";
import { findAllVaccinationRecords } from "../repositories/VaccinationRecordRepository.js";
import { findChildrenByAgeRange } from "../repositories/ChildRepository.js";
import { findAllVaccines } from "../repositories/VaccineRepository.js";

export const getCoverageReports = async (filters = {}) => {
  const { hospitalId, period, vaccineId } = filters;
  const query = {};

  if (hospitalId) query.hospital = hospitalId;
  if (period) {
    const [year, month] = period.split("-");
    query["period.year"] = parseInt(year);
    query["period.month"] = parseInt(month);
  }

  return await findAllCoverageReports(query);
};

export const getCoverageReportById = async (reportId) => {
  const report = await findCoverageReportById(reportId);
  if (!report) {
    throw new Error("Coverage report not found");
  }
  return report;
};

export const generateCoverageReport = async (reportData, userId) => {
  const { hospitalId, period, notes } = reportData;

  if (!hospitalId || !period || !period.month || !period.year) {
    throw new Error("Hospital ID and period (month, year) are required");
  }

  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // Calculate coverage for each vaccine
  const vaccines = await findAllVaccines({ isActive: true });
  const coverageData = [];

  for (const vaccine of vaccines) {
    const coverage = await calculateVaccineCoverage(
      hospitalId,
      vaccine._id,
      period
    );
    coverageData.push({
      vaccine: vaccine._id,
      target: 90, // Default target coverage
      actual: coverage.rate,
      gap: 90 - coverage.rate,
      trend: await getTrend(hospitalId, vaccine._id, period),
      status: getCoverageStatus(coverage.rate),
      vaccinationsGiven: coverage.count,
      eligibleChildren: coverage.total,
    });
  }

  const totalCoverage = calculateTotalCoverage(coverageData);

  const report = await createNewCoverageReport({
    hospital: hospitalId,
    period: {
      month: period.month,
      year: period.year,
      quarter: Math.ceil(period.month / 3),
    },
    coverageData,
    totalCoverage,
    totalVaccinations: coverageData.reduce(
      (sum, item) => sum + item.vaccinationsGiven,
      0
    ),
    totalEligible: coverageData.reduce(
      (sum, item) => sum + item.eligibleChildren,
      0
    ),
    generatedBy: userId,
    notes,
    isFinal: reportData.isFinal || false,
  });

  return report;
};

export const updateCoverageReport = async (reportId, updateData) => {
  const report = await findCoverageReportById(reportId);
  if (!report) {
    throw new Error("Coverage report not found");
  }

  return await updateExistingCoverageReport(reportId, updateData);
};

export const getRegionalCoverage = async (filters = {}) => {
  const { county, subCounty, startDate, endDate } = filters;

  // Aggregate coverage data by region
  const aggregationPipeline = [
    {
      $match: {
        ...(county && { "location.county": county }),
        ...(subCounty && { "location.subCounty": subCounty }),
      },
    },
    {
      $lookup: {
        from: "coveragereports",
        localField: "_id",
        foreignField: "hospital",
        as: "reports",
      },
    },
    {
      $project: {
        name: 1,
        county: "$location.county",
        subCounty: "$location.subCounty",
        latestCoverage: { $arrayElemAt: ["$reports.totalCoverage", -1] },
        reportCount: { $size: "$reports" },
      },
    },
    { $sort: { county: 1, subCounty: 1 } },
  ];

  // This would require proper aggregation setup
  return {
    message: "Regional coverage analysis requires additional implementation",
  };
};

export const getVaccineCoverageTrends = async (
  vaccineId,
  region,
  period = "6m"
) => {
  // Calculate coverage trends over time
  const months = 6; // Default to 6 months
  const trends = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const coverage = await calculateVaccineCoverageByRegion(vaccineId, region, {
      month,
      year,
    });
    trends.push({
      period: `${year}-${month.toString().padStart(2, "0")}`,
      coverage: coverage.rate,
      vaccinations: coverage.count,
    });
  }

  return {
    vaccineId,
    region,
    period,
    trends,
    average: trends.reduce((sum, t) => sum + t.coverage, 0) / trends.length,
    trendDirection: calculateTrendDirection(trends.map((t) => t.coverage)),
  };
};

export const getCoverageGapAnalysis = async (
  hospitalId,
  region,
  target = 90
) => {
  const analysis = [];

  if (hospitalId) {
    const hospital = await findHospitalById(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Get hospital-specific gaps
    const reports = await findReportsByHospitalId(hospitalId);
    const latestReport = reports[0];

    if (latestReport) {
      latestReport.coverageData.forEach((item) => {
        if (item.actual < target) {
          analysis.push({
            vaccine: item.vaccine,
            currentCoverage: item.actual,
            target,
            gap: target - item.actual,
            priority: getGapPriority(target - item.actual),
            recommendations: generateGapRecommendations(item.actual, target),
          });
        }
      });
    }
  }

  return {
    hospitalId,
    region,
    target,
    gaps: analysis,
    totalGaps: analysis.length,
    criticalGaps: analysis.filter((g) => g.priority === "high").length,
    estimatedImpact: estimateImpactOfClosingGaps(analysis),
  };
};

// Helper functions
const calculateVaccineCoverage = async (hospitalId, vaccineId, period) => {
  // Get eligible children for this vaccine based on age
  const vaccine = await findVaccineById(vaccineId);
  const eligibleChildren = await findChildrenByAgeRange(
    0,
    vaccine.recommendedAge.months + 3
  );

  // Get vaccinations given in this period
  const startDate = new Date(period.year, period.month - 1, 1);
  const endDate = new Date(period.year, period.month, 0);

  const vaccinations = await findAllVaccinationRecords({
    vaccine: vaccineId,
    dateGiven: { $gte: startDate, $lte: endDate },
    status: "completed",
  });

  const count = vaccinations.length;
  const total = eligibleChildren.length;
  const rate = total > 0 ? (count / total) * 100 : 0;

  return { count, total, rate };
};

const calculateTotalCoverage = (coverageData) => {
  if (coverageData.length === 0) return 0;

  const totalActual = coverageData.reduce((sum, item) => sum + item.actual, 0);
  return totalActual / coverageData.length;
};

const getCoverageStatus = (rate) => {
  if (rate >= 90) return "on_target";
  if (rate >= 80) return "near_target";
  return "off_target";
};

const getTrend = async (hospitalId, vaccineId, period) => {
  // Compare with previous period
  const previousMonth = period.month === 1 ? 12 : period.month - 1;
  const previousYear = period.month === 1 ? period.year - 1 : period.year;

  const current = await calculateVaccineCoverage(hospitalId, vaccineId, period);
  const previous = await calculateVaccineCoverage(hospitalId, vaccineId, {
    month: previousMonth,
    year: previousYear,
  });

  if (current.rate > previous.rate) return "up";
  if (current.rate < previous.rate) return "down";
  return "stable";
};

const getGapPriority = (gap) => {
  if (gap > 20) return "critical";
  if (gap > 10) return "high";
  if (gap > 5) return "medium";
  return "low";
};

const generateGapRecommendations = (current, target) => {
  const gap = target - current;
  const recommendations = [];

  if (gap > 20) {
    recommendations.push("Organize vaccination outreach camp");
    recommendations.push("Increase community mobilization efforts");
    recommendations.push("Schedule extra vaccination days");
  } else if (gap > 10) {
    recommendations.push("Send targeted reminders to defaulters");
    recommendations.push("Increase CHW follow-up visits");
    recommendations.push("Review and improve access to facility");
  } else {
    recommendations.push("Continue current efforts");
    recommendations.push("Monitor defaulters closely");
  }

  return recommendations;
};

const estimateImpactOfClosingGaps = (gaps) => {
  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);
  const avgGap = gaps.length > 0 ? totalGap / gaps.length : 0;

  return {
    additionalVaccinations: Math.ceil(totalGap * 10), // Simplified estimate
    potentialChildrenProtected: Math.ceil(totalGap * 15),
    estimatedTimeToClose:
      avgGap > 20 ? "3-6 months" : avgGap > 10 ? "1-3 months" : "1 month",
  };
};

const calculateTrendDirection = (coverageValues) => {
  if (coverageValues.length < 2) return "insufficient_data";

  const recent = coverageValues.slice(-3);
  const earlier = coverageValues.slice(0, -3);

  if (earlier.length === 0) return "insufficient_data";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  if (recentAvg > earlierAvg + 2) return "improving";
  if (recentAvg < earlierAvg - 2) return "declining";
  return "stable";
};
