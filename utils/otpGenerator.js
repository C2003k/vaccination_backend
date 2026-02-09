/**
 * OTP (One-Time Password) Generator and Validator
 */

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

/**
 * Generate a secure token for password reset
 * @param {number} length - Length of token (default: 32)
 * @returns {string} Generated token
 */
export const generateSecureToken = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  // Use crypto if available, otherwise fallback to Math.random
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return token;
};

/**
 * Generate a verification code for email/phone verification
 * @returns {Object} Verification code and expiry
 */
export const generateVerificationCode = () => {
  const code = generateOTP(6);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return {
    code,
    expiry,
    attempts: 0,
    verified: false,
  };
};

/**
 * Validate OTP
 * @param {string} otp - OTP to validate
 * @param {string} storedOTP - Stored OTP
 * @param {Date} expiry - Expiry date
 * @param {number} maxAttempts - Maximum allowed attempts
 * @param {number} currentAttempts - Current number of attempts
 * @returns {Object} Validation result
 */
export const validateOTP = (
  otp,
  storedOTP,
  expiry,
  currentAttempts = 0,
  maxAttempts = 3
) => {
  const now = new Date();

  if (currentAttempts >= maxAttempts) {
    return {
      valid: false,
      message: "Maximum attempts exceeded. Please request a new OTP.",
      remainingAttempts: 0,
    };
  }

  if (now > expiry) {
    return {
      valid: false,
      message: "OTP has expired. Please request a new one.",
      remainingAttempts: maxAttempts - currentAttempts,
    };
  }

  if (otp !== storedOTP) {
    const remaining = maxAttempts - (currentAttempts + 1);
    return {
      valid: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  return {
    valid: true,
    message: "OTP verified successfully.",
    remainingAttempts: maxAttempts - currentAttempts,
  };
};

/**
 * Generate a session token
 * @returns {string} Session token
 */
export const generateSessionToken = () => {
  return generateSecureToken(64);
};

/**
 * Generate a short URL-friendly ID
 * @returns {string} Short ID
 */
export const generateShortId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${timestamp}${random}`.toUpperCase();
};

/**
 * Generate a batch number for vaccines
 * @param {string} vaccineCode - Vaccine code
 * @returns {string} Batch number
 */
export const generateBatchNumber = (vaccineCode) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${vaccineCode}-${year}${month}${day}-${random}`;
};

/**
 * Generate a child registration number
 * @param {string} countyCode - County code
 * @param {number} sequence - Sequence number
 * @returns {string} Registration number
 */
export const generateChildRegistrationNumber = (countyCode, sequence) => {
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  return `CHD-${countyCode}-${year}${month}-${sequence
    .toString()
    .padStart(6, "0")}`;
};

/**
 * Generate a CHW ID
 * @param {string} countyCode - County code
 * @param {number} sequence - Sequence number
 * @returns {string} CHW ID
 */
export const generateCHWId = (countyCode, sequence) => {
  return `CHW-${countyCode}-${sequence.toString().padStart(4, "0")}`;
};

/**
 * Generate a hospital ID
 * @param {string} countyCode - County code
 * @param {string} type - Hospital type
 * @param {number} sequence - Sequence number
 * @returns {string} Hospital ID
 */
export const generateHospitalId = (countyCode, type, sequence) => {
  const typeCode = type.substring(0, 3).toUpperCase();
  return `HOSP-${countyCode}-${typeCode}-${sequence
    .toString()
    .padStart(3, "0")}`;
};
