const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory structure
    const category = req.body.category || 'purposes';
    const uploadPath = path.join(process.cwd(), 'uploads', category);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.originalname) || '.jpg';
    const filename = `purpose_${timestamp}_${random}${extension}`;
    
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
        responseMessage: 'Unexpected field. Only "image" field is allowed.',
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
  handleUploadError
};