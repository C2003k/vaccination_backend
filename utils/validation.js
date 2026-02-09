/**
 * Validation utilities for the vaccination tracker
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Kenyan phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  if (!phone) return false;

  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Kenyan phone numbers: 254 followed by 9 digits, or 07 followed by 8 digits
  const phoneRegex = /^(254\d{9}|07\d{8}|01\d{8})$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: [],
  };

  if (!password || password.length < 8) {
    result.isValid = false;
    result.errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.errors.push("Password must contain at least one special character");
  }

  return result;
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @param {boolean} allowFuture - Whether to allow future dates
 * @returns {boolean} True if valid
 */
export const validateDate = (dateString, allowFuture = false) => {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  if (!allowFuture && date > new Date()) {
    return false;
  }

  return true;
};

/**
 * Validate child's date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {Object} Validation result
 */
export const validateChildDOB = (dateOfBirth) => {
  const result = {
    isValid: true,
    errors: [],
  };

  if (!dateOfBirth) {
    result.isValid = false;
    result.errors.push("Date of birth is required");
    return result;
  }

  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dob.getTime())) {
    result.isValid = false;
    result.errors.push("Invalid date format");
    return result;
  }

  if (dob > today) {
    result.isValid = false;
    result.errors.push("Date of birth cannot be in the future");
  }

  // Check if child is too old (e.g., over 18 years)
  const ageInYears = (today - dob) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageInYears > 18) {
    result.isValid = false;
    result.errors.push("Child must be under 18 years old");
  }

  // Check if child is too young (e.g., negative age)
  if (dob > today) {
    result.isValid = false;
    result.errors.push("Date of birth cannot be in the future");
  }

  return result;
};

/**
 * Validate vaccine batch number
 * @param {string} batchNumber - Batch number to validate
 * @returns {boolean} True if valid
 */
export const validateBatchNumber = (batchNumber) => {
  if (!batchNumber) return false;

  // Batch number format: ABC-2023-12345 or similar
  const batchRegex = /^[A-Z0-9]{3,}-[0-9]{4,}-[A-Z0-9]{3,}$/i;
  return batchRegex.test(batchNumber);
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
export const validateCoordinates = (lat, lng) => {
  if (lat === undefined || lng === undefined) return false;

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) return false;

  if (latNum < -90 || latNum > 90) return false;
  if (lngNum < -180 || lngNum > 180) return false;

  return true;
};

/**
 * Validate weight (in kg)
 * @param {number} weight - Weight in kg
 * @returns {boolean} True if valid
 */
export const validateWeight = (weight) => {
  if (weight === undefined || weight === null) return false;

  const weightNum = parseFloat(weight);
  if (isNaN(weightNum)) return false;

  // Reasonable weight range for children: 1kg to 50kg
  return weightNum >= 1 && weightNum <= 50;
};

/**
 * Validate height (in cm)
 * @param {number} height - Height in cm
 * @returns {boolean} True if valid
 */
export const validateHeight = (height) => {
  if (height === undefined || height === null) return false;

  const heightNum = parseFloat(height);
  if (isNaN(heightNum)) return false;

  // Reasonable height range for children: 30cm to 200cm
  return heightNum >= 30 && heightNum <= 200;
};

/**
 * Validate temperature (in Celsius)
 * @param {number} temperature - Temperature in Celsius
 * @returns {boolean} True if valid
 */
export const validateTemperature = (temperature) => {
  if (temperature === undefined || temperature === null) return false;

  const tempNum = parseFloat(temperature);
  if (isNaN(tempNum)) return false;

  // Reasonable temperature range: 30°C to 45°C
  return tempNum >= 30 && tempNum <= 45;
};

/**
 * Validate Kenyan county name
 * @param {string} county - County name
 * @returns {boolean} True if valid
 */
export const validateCounty = (county) => {
  if (!county) return false;

  const counties = [
    "Mombasa",
    "Kwale",
    "Kilifi",
    "Tana River",
    "Lamu",
    "Taita-Taveta",
    "Garissa",
    "Wajir",
    "Mandera",
    "Marsabit",
    "Isiolo",
    "Meru",
    "Tharaka-Nithi",
    "Embu",
    "Kitui",
    "Machakos",
    "Makueni",
    "Nyandarua",
    "Nyeri",
    "Kirinyaga",
    "Murang'a",
    "Kiambu",
    "Turkana",
    "West Pokot",
    "Samburu",
    "Trans Nzoia",
    "Uasin Gishu",
    "Elgeyo-Marakwet",
    "Nandi",
    "Baringo",
    "Laikipia",
    "Nakuru",
    "Narok",
    "Kajiado",
    "Kericho",
    "Bomet",
    "Kakamega",
    "Vihiga",
    "Bungoma",
    "Busia",
    "Siaya",
    "Kisumu",
    "Homa Bay",
    "Migori",
    "Kisii",
    "Nyamira",
    "Nairobi",
  ];

  return counties.includes(county.trim());
};

/**
 * Validate vaccination date
 * @param {Date} vaccinationDate - Vaccination date
 * @param {Date} childDOB - Child's date of birth
 * @returns {Object} Validation result
 */
export const validateVaccinationDate = (vaccinationDate, childDOB) => {
  const result = {
    isValid: true,
    errors: [],
  };

  const vaxDate = new Date(vaccinationDate);
  const dob = new Date(childDOB);
  const today = new Date();

  if (isNaN(vaxDate.getTime())) {
    result.isValid = false;
    result.errors.push("Invalid vaccination date");
    return result;
  }

  if (vaxDate > today) {
    result.isValid = false;
    result.errors.push("Vaccination date cannot be in the future");
  }

  if (vaxDate < dob) {
    result.isValid = false;
    result.errors.push("Vaccination date cannot be before child's birth date");
  }

  return result;
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export const validateRange = (value, min, max) => {
  if (value === undefined || value === null) return false;

  const num = parseFloat(value);
  if (isNaN(num)) return false;

  return num >= min && num <= max;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const validateURL = (url) => {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate object ID format (MongoDB)
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid
 */
export const validateObjectId = (id) => {
  if (!id) return false;

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean} True if valid
 */
export const validateJSON = (jsonString) => {
  if (!jsonString) return false;

  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate required fields in an object
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
  const result = {
    isValid: true,
    errors: [],
    missingFields: [],
  };

  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      result.isValid = false;
      result.missingFields.push(field);
      result.errors.push(`${field} is required`);
    }
  }

  return result;
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return "";

  return input
    .toString()
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validate file type
 * @param {File} file - File object
 * @param {Array} allowedTypes - Allowed MIME types
 * @returns {boolean} True if valid
 */
export const validateFileType = (
  file,
  allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} True if valid
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file || !file.size) return false;
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  return file.size <= maxSize;
};
