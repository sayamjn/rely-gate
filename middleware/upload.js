const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine category based on fieldname or body
    let category = 'purposes'; // default
    
    if (file.fieldname === 'photoPath' || file.fieldname === 'photo') {
      category = 'visitors';
    } else if (file.fieldname === 'vehiclePhotoPath' || file.fieldname === 'vehiclePhoto') {
      category = 'vehicles';
    } else if (file.fieldname === 'approverPhoto') {
      category = 'approvers';
    } else if (file.fieldname === 'logo') {
      category = 'logos';
    } else if (req.body.category) {
      category = req.body.category;
    }
    
    const uploadPath = path.join(process.cwd(), 'uploads', category);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename based on file type
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.originalname) || '.jpg';
    
    let prefix = 'file';
    if (file.fieldname === 'photoPath' || file.fieldname === 'photo') {
      prefix = 'visitor';
    } else if (file.fieldname === 'vehiclePhotoPath' || file.fieldname === 'vehiclePhoto') {
      prefix = 'vehicle';
    } else if (file.fieldname === 'approverPhoto') {
      prefix = 'approver';
    } else if (file.fieldname === 'logo') {
      prefix = `tenant_${req.user?.tenantId || 'unknown'}_logo`;
    } else if (file.fieldname === 'image') {
      prefix = 'purpose';
    }
    
    const filename = `${prefix}_${timestamp}_${random}${extension}`;
    
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Single file upload middleware for purpose images
const uploadPurposeImage = upload.single('image');

// Single file upload middleware for logo
const uploadLogo = upload.single('logo');

// Multiple file upload middleware for visitor registration (photo and vehicle)
const uploadVisitorImages = upload.fields([
  { name: 'photoPath', maxCount: 1 },
  { name: 'vehiclePhotoPath', maxCount: 1 }
]);

// Alternative field names for visitor images
const uploadVisitorImagesAlt = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'vehiclePhoto', maxCount: 1 }
]);

// Single file upload middleware for approver photos
const uploadApproverPhoto = upload.single('approverPhoto');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'File too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'Unexpected field in file upload.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'Too many files uploaded.',
      });
    }
  }
  
  if (err && err.message === 'Only image files are allowed!') {
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Only image files are allowed.',
    });
  }
  
  next(err);
};

module.exports = {
  uploadPurposeImage,
  uploadLogo,
  uploadVisitorImages,
  uploadVisitorImagesAlt,
  uploadApproverPhoto,
  handleUploadError
};