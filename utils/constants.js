const RESPONSE_CODES = {
  SUCCESS: 'S',
  ERROR: 'E',
  EXISTS: 'F',
  MOBILE_EXISTS: 'X',
  WARNING: 'W',
  INFO: 'I',
  VALIDATION_ERROR: 'V',
  UNAUTHORIZED: 'U',
  FORBIDDEN: 'FB',
  NOT_FOUND: 'NF'
};

const RESPONSE_MESSAGES = {
  // Success Messages
  SUCCESS: 'Record(s) saved successfully',
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  LOGOUT_SUCCESS: 'Logout successful',
  UPDATE_SUCCESS: 'Record(s) updated successfully',
  DELETE_SUCCESS: 'Record(s) deleted successfully',
  VISITOR_CREATED: 'Visitor created successfully',
  VISITOR_UPDATED: 'Visitor updated successfully',
  VISITOR_DELETED: 'Visitor deleted successfully',
  CHECKIN_SUCCESS: 'Visitor checked in successfully',
  CHECKOUT_SUCCESS: 'Visitor checked out successfully',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  QR_GENERATED: 'QR code generated successfully',
  QR_SCANNED: 'QR code scanned successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  FCM_TOKEN_UPDATED: 'FCM token updated successfully',
  BULK_UPLOAD_SUCCESS: 'Bulk upload completed successfully',

  // Error Messages
  ERROR: 'Record(s) failed to save',
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_INACTIVE: 'User account is inactive',
  USER_NOT_FOUND: 'User not found',
  MISSING_FIELDS: 'Required fields are missing',
  INVALID_INPUT: 'Invalid input provided',
  INVALID_REQUEST: 'Invalid request format',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token provided',
  TENANT_ACCESS_DENIED: 'Access denied for this tenant',
  VISITOR_NOT_FOUND: 'Visitor not found',
  VISITOR_ALREADY_CHECKED_IN: 'Visitor is already checked in',
  VISITOR_ALREADY_CHECKED_OUT: 'Visitor is already checked out',
  VISITOR_INACTIVE: 'Visitor is inactive',
  OTP_INVALID: 'Invalid or expired OTP',
  OTP_EXPIRED: 'OTP has expired',
  OTP_ALREADY_VERIFIED: 'OTP already verified',
  QR_INVALID: 'Invalid QR code',
  QR_EXPIRED: 'QR code has expired',
  FILE_UPLOAD_ERROR: 'File upload failed',
  FILE_NOT_FOUND: 'File not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_SIZE_EXCEEDED: 'File size exceeded limit',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network error occurred',
  INTERNAL_ERROR: 'Internal server error',

  // Existence Messages
  EXISTS: 'Record(s) already exists',
  USER_EXISTS: 'User already exists',
  MOBILE_EXISTS: 'Mobile number is already registered',
  EMAIL_EXISTS: 'Email is already registered',
  VISITOR_EXISTS: 'Visitor already exists',

  // Validation Messages
  VALIDATION_ERROR: 'Validation failed',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_MOBILE: 'Invalid mobile number format',
  INVALID_DATE: 'Invalid date format',
  INVALID_NUMBER: 'Invalid number format',
  FIELD_REQUIRED: 'This field is required',
  FIELD_TOO_SHORT: 'Field value is too short',
  FIELD_TOO_LONG: 'Field value is too long',
  PASSWORD_TOO_WEAK: 'Password is too weak',
  INVALID_TENANT_ID: 'Invalid tenant ID',
  INVALID_USER_ID: 'Invalid user ID',
  INVALID_VISITOR_ID: 'Invalid visitor ID'
};

const STATUS_CODES = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3,
  APPROVED: 4,
  REJECTED: 5,
  CANCELLED: 6,
  CHECKED_IN: 7,
  CHECKED_OUT: 8,
  EXPIRED: 9
};

const STATUS_NAMES = {
  [STATUS_CODES.ACTIVE]: 'ACTIVE',
  [STATUS_CODES.INACTIVE]: 'INACTIVE', 
  [STATUS_CODES.PENDING]: 'PENDING',
  [STATUS_CODES.APPROVED]: 'APPROVED',
  [STATUS_CODES.REJECTED]: 'REJECTED',
  [STATUS_CODES.CANCELLED]: 'CANCELLED',
  [STATUS_CODES.CHECKED_IN]: 'CHECKED_IN',
  [STATUS_CODES.CHECKED_OUT]: 'CHECKED_OUT',
  [STATUS_CODES.EXPIRED]: 'EXPIRED'
};

const VISITOR_CATEGORIES = {
  STAFF: 1,
  UNREGISTERED: 2, 
  STUDENT: 3,
  GUEST: 4,
  BUSINESS: 5
};

const VISITOR_CATEGORY_NAMES = {
  [VISITOR_CATEGORIES.STAFF]: 'Staff',
  [VISITOR_CATEGORIES.UNREGISTERED]: 'Unregistered',
  [VISITOR_CATEGORIES.STUDENT]: 'Student', 
  [VISITOR_CATEGORIES.GUEST]: 'Guest',
  [VISITOR_CATEGORIES.BUSINESS]: 'Business'
};

const USER_ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SECURITY: 3,
  RESIDENT: 4,
  MAINTENANCE: 5
};

const PERMISSIONS = {
  CREATE_VISITOR: 'create_visitor',
  UPDATE_VISITOR: 'update_visitor',
  DELETE_VISITOR: 'delete_visitor',
  VIEW_VISITOR: 'view_visitor',
  CHECKIN_VISITOR: 'checkin_visitor',
  CHECKOUT_VISITOR: 'checkout_visitor',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_USERS: 'manage_users',
  MANAGE_TENANTS: 'manage_tenants',
  BULK_UPLOAD: 'bulk_upload',
  EXPORT_DATA: 'export_data'
};

const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf'
};

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  DEFAULT: 5 * 1024 * 1024 // 5MB
};

const QR_CODE_TYPES = {
  VISITOR_REGISTRATION: 'visitor_reg',
  SECURITY_CODE: 'security_code',
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out'
};

const OTP_SETTINGS = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_DELAY_SECONDS: 60
};

const DEFAULT_PAGINATION = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

const TIME_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm:ss',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

const REGEX_PATTERNS = {
  MOBILE: /^[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ONLY_LETTERS: /^[a-zA-Z\s]+$/,
  ONLY_NUMBERS: /^\d+$/
};

const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  NOT_FOUND: 'NotFoundError',
  CONFLICT: 'ConflictError',
  BUSINESS_LOGIC: 'BusinessLogicError',
  EXTERNAL_API: 'ExternalAPIError',
  DATABASE: 'DatabaseError',
  FILE_UPLOAD: 'FileUploadError'
};

const SMS_TEMPLATES = {
  OTP: 'Your OTP for {TENANT_NAME} is {OTP}. This OTP is valid for {EXPIRY} minutes.',
  SECURITY_CODE: 'Your security code for {TENANT_NAME} is {CODE}.',
  VISITOR_CHECKIN: '{VISITOR_NAME} has checked in at {TIME}.',
  VISITOR_CHECKOUT: '{VISITOR_NAME} has checked out at {TIME}.'
};

const FCM_MESSAGE_TYPES = {
  VISITOR_CHECKIN: 'visitor_checkin',
  VISITOR_CHECKOUT: 'visitor_checkout', 
  VISITOR_REGISTRATION: 'visitor_registration',
  SECURITY_ALERT: 'security_alert',
  SYSTEM_NOTIFICATION: 'system_notification'
};

// Utility functions for constants
const getStatusName = (statusId) => {
  return STATUS_NAMES[statusId] || 'UNKNOWN';
};

const getCategoryName = (categoryId) => {
  return VISITOR_CATEGORY_NAMES[categoryId] || 'UNKNOWN';
};

const isValidImageType = (mimeType) => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
};

const isValidDocumentType = (mimeType) => {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType.toLowerCase());
};

const getFileSizeLimit = (fileType) => {
  return FILE_SIZE_LIMITS[fileType.toUpperCase()] || FILE_SIZE_LIMITS.DEFAULT;
};

const validateMobile = (mobile) => {
  return REGEX_PATTERNS.MOBILE.test(mobile);
};

const validateEmail = (email) => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

const validatePassword = (password) => {
  return REGEX_PATTERNS.PASSWORD.test(password);
};

module.exports = {
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
  STATUS_CODES,
  STATUS_NAMES,
  VISITOR_CATEGORIES,
  VISITOR_CATEGORY_NAMES,
  USER_ROLES,
  PERMISSIONS,
  FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  FILE_SIZE_LIMITS,
  QR_CODE_TYPES,
  OTP_SETTINGS,
  DEFAULT_PAGINATION,
  TIME_FORMATS,
  REGEX_PATTERNS,
  ERROR_TYPES,
  SMS_TEMPLATES,
  FCM_MESSAGE_TYPES,
  
  // Utility functions
  getStatusName,
  getCategoryName,
  isValidImageType,
  isValidDocumentType,
  getFileSizeLimit,
  validateMobile,
  validateEmail,
  validatePassword
};