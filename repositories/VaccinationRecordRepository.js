import VaccinationRecord from "../models/VaccinationRecord.js";

export const findAllVaccinationRecords = async (filter = {}) => {
  try {
    return await VaccinationRecord.find(filter)
      .populate("child")
      .populate("vaccine")
      .populate("givenBy")
      .sort({ dateGiven: -1 });
  } catch (error) {
    throw new Error(`Error finding vaccination records: ${error.message}`);
  }
};

export const findVaccinationRecordById = async (recordId) => {
  try {
    return await VaccinationRecord.findById(recordId)
      .populate("child")
      .populate("vaccine")
      .populate("givenBy");
  } catch (error) {
    throw new Error(`Error finding vaccination record by ID: ${error.message}`);
  }
};

export const findRecordsByChildId = async (childId) => {
  try {
    return await VaccinationRecord.find({ child: childId })
      .populate("vaccine")
      .populate("givenBy")
      .sort({ dateGiven: -1 });
  } catch (error) {
    throw new Error(`Error finding records by child: ${error.message}`);
  }
};

export const createNewVaccinationRecord = async (recordData) => {
  try {
    const record = new VaccinationRecord(recordData);
    return await record.save();
  } catch (error) {
    throw new Error(`Error creating vaccination record: ${error.message}`);
  }
};

export const updateExistingVaccinationRecord = async (recordId, updateData) => {
  try {
    return await VaccinationRecord.findByIdAndUpdate(recordId, updateData, {
      new: true,
      runValidators: true,
    }).populate("child vaccine givenBy");
  } catch (error) {
    throw new Error(`Error updating vaccination record: ${error.message}`);
  }
};
