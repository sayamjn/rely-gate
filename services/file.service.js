const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileService {
  static uploadDir = path.join(process.cwd(), 'uploads');

  static categories = {
    VISITORS: 'visitors',
    REGISTERED_VISITORS: 'registered_visitors',
    VEHICLES: 'vehicles',
    VISITOR_IDS: 'visitor_ids',
    QR_CODES: 'qr_codes',
    LOGOS: 'logos'
  };

  static generateFilename(originalName, category) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const extension = path.extname(originalName) || '.jpeg';
    
    return `${category}_${timestamp}_${random}${extension}`;
  }

  // Save base64 image with enhanced error handling
  static async saveBase64Image(base64String, category, customName = null) {
    try {
      if (!base64String) {
        throw new Error('No image data provided');
      }

      const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const filename = customName || this.generateFilename('image.jpeg', category);
      
      const categoryDir = path.join(this.uploadDir, category);
      await fs.mkdir(categoryDir, { recursive: true });
      
      const filePath = path.join(categoryDir, filename);
      
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      await fs.writeFile(filePath, imageBuffer);
      
      return {
        success: true,
        filename,
        category,
        filePath,
        url: this.getFileUrl(category, filename),
        size: imageBuffer.length
      };
    } catch (error) {
      console.error('Error saving base64 image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enhanced legacy save image method for backward compatibility
  static async saveImage(imgStr, imgName, ext, filePath) {
    try {
      if (ext === 'N/A' || !imgStr) {
        return false;
      }

      await fs.mkdir(filePath, { recursive: true });

      const cleanBase64 = imgStr.replace(/\n/g, '').replace(/ /g, '');
      const imageBuffer = Buffer.from(cleanBase64, 'base64');

      const fullPath = path.join(filePath, `${imgName}${ext}`);
      await fs.writeFile(fullPath, imageBuffer);

      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  }

  // Generate file URL
  static getFileUrl(category, filename, baseUrl = null) {
    if (!baseUrl) {
      baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    }
    return `/uploads/${category}/${filename}`;
  }

  // Check if file exists
  static async fileExists(category, filename) {
    try {
      const filePath = path.join(this.uploadDir, category, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Delete file
  static async deleteFile(category, filename) {
    try {
      const filePath = path.join(this.uploadDir, category, filename);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get file info
  static async getFileInfo(category, filename) {
    try {
      const filePath = path.join(this.uploadDir, category, filename);
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        data: {
          filename,
          category,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: this.getFileUrl(category, filename)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'File not found'
      };
    }
  }

  // Clean up old files
  static async cleanupOldFiles(category, maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    try {
      const categoryDir = path.join(this.uploadDir, category);
      const files = await fs.readdir(categoryDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(categoryDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return { success: true, deletedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static generateImageName(prefix) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '_');
    const milliseconds = now.getMilliseconds();
    return `${prefix}_${dateStr}_${milliseconds}`;
  }
}

module.exports = FileService;