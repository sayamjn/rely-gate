const RESPONSE_CODES = {
  SUCCESS: 'S',
  ERROR: 'E',
  EXISTS: 'F',
  MOBILE_EXISTS: 'X'
};

const RESPONSE_MESSAGES = {
  SUCCESS: 'Record(s) saved successfully',
  ERROR: 'Record(s) failed to save',
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  USER_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_INACTIVE: 'User account is inactive',
  MISSING_FIELDS: 'Username, password, and tenantId are required',
      EXISTS: 'Record(s) already exists',
    MOBILE_EXISTS: 'Mobile number is already registered',
    OTP_SENT: 'OTP sent successfully',
    OTP_VERIFIED: 'OTP verified successfully',
    OTP_INVALID: 'Invalid or expired OTP',
    VISITOR_CREATED: 'Visitor created successfully'
};

module.exports = {
    RESPONSE_CODES,
    RESPONSE_MESSAGES
}