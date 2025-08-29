const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileProcessor {
  // Process base64 image and save to file system
  static async processBase64Image(base64Data, category, tenantId) {
    try {
      if (!base64Data) {
        return { success: false, message: 'No image data provided' };
      }

      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      if (!this.isValidBase64(base64String)) {
        return { success: false, message: 'Invalid base64 image format' };
      }

      const imageBuffer = Buffer.from(base64String, 'base64');
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        return { success: false, message: 'Image size exceeds 5MB limit' };
      }

      const imageType = this.detectImageType(imageBuffer);
      if (!imageType) {
        return { success: false, message: 'Unsupported image format' };
      }

      const timestamp = Date.now();
      const randomHash = crypto.randomBytes(5).toString('hex');
      const filename = `${category}_${timestamp}_${randomHash}.${imageType}`;

      const uploadDir = path.join(process.cwd(), 'uploads', category);
      await this.ensureDirectoryExists(uploadDir);

      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, imageBuffer);

      return {
        success: true,
        filename,
        path: filePath,
        size: imageBuffer.length,
        type: imageType
      };
    } catch (error) {
      console.error('Error processing base64 image:', error);
      return { success: false, message: 'Failed to process image' };
    }
  }

  // Check if string is valid base64
  static isValidBase64(str) {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (error) {
      return false;
    }
  }

  // Detect image type from buffer
  static detectImageType(buffer) {
    // Check for common image file signatures
    const signatures = {
      jpg: [0xFF, 0xD8, 0xFF],
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    for (const [type, signature] of Object.entries(signatures)) {
      if (buffer.length >= signature.length) {
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return type === 'jpeg' ? 'jpg' : type;
        }
      }
    }

    return null;
  }

  // Ensure directory exists
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Delete file
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, message: 'Failed to delete file' };
    }
  }

  // Get file info
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { success: false, message: 'File not found' };
    }
  }

  // Validate file path (security check)
  static isValidFilePath(filePath, allowedDirectories = ['uploads']) {
    const normalizedPath = path.normalize(filePath);
    const absolutePath = path.resolve(normalizedPath);
    const projectRoot = process.cwd();
    
    // Check if file is within project directory
    if (!absolutePath.startsWith(projectRoot)) {
      return false;
    }
    
    // Check if file is within allowed directories
    const relativePath = path.relative(projectRoot, absolutePath);
    const isInAllowedDir = allowedDirectories.some(dir => 
      relativePath.startsWith(dir + path.sep) || relativePath === dir
    );
    
    return isInAllowedDir;
  }
}

module.exports = {
  processBase64Image: FileProcessor.processBase64Image.bind(FileProcessor),
  deleteFile: FileProcessor.deleteFile.bind(FileProcessor),
  getFileInfo: FileProcessor.getFileInfo.bind(FileProcessor),
  isValidFilePath: FileProcessor.isValidFilePath.bind(FileProcessor)
};