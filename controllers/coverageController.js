import {
  getCoverageReports,
  getCoverageReportById,
  generateCoverageReport,
  updateCoverageReport,
  getRegionalCoverage,
  getVaccineCoverageTrends,
  getCoverageGapAnalysis,
} from "../services/CoverageService.js";

export const getCoverageReportsHandler = async (req, res) => {
  try {
    const { hospitalId, period, vaccineId } = req.query;
    const reports = await getCoverageReports({ hospitalId, period, vaccineId });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCoverageReportHandler = async (req, res) => {
  try {
    const report = await getCoverageReportById(req.params.id);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message === "Coverage report not found") {
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

export const generateCoverageReportHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const report = await generateCoverageReport(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Coverage report generated successfully",
      data: report,
    });
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("Hospital not found")
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

export const updateCoverageReportHandler = async (req, res) => {
  try {
    const report = await updateCoverageReport(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Coverage report updated successfully",
      data: report,
    });
  } catch (error) {
    if (error.message === "Coverage report not found") {
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

export const getRegionalCoverageHandler = async (req, res) => {
  try {
    const { county, subCounty, startDate, endDate } = req.query;
    const coverage = await getRegionalCoverage({
      county,
      subCounty,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: coverage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVaccineCoverageTrendsHandler = async (req, res) => {
  try {
    const { vaccineId, region, period } = req.query;
    const trends = await getVaccineCoverageTrends(vaccineId, region, period);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCoverageGapAnalysisHandler = async (req, res) => {
  try {
    const { hospitalId, region, target = 90 } = req.query;
    const analysis = await getCoverageGapAnalysis(
      hospitalId,
      region,
      parseInt(target)
    );

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
