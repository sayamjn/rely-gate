const FileService = require('../services/file.service');

class FileController {
  // GET /api/files/:category/:filename/info
  static async getFileInfo(req, res) {
    try {
      const { category, filename } = req.params;
      
      const result = await FileService.getFileInfo(category, filename);
      
      if (result.success) {
        res.json({
          responseCode: 'S',
          data: result.data
        });
      } else {
        res.status(404).json({
          responseCode: 'E',
          responseMessage: result.error
        });
      }
    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // DELETE /api/files/:category/:filename
  static async deleteFile(req, res) {
    try {
      const { category, filename } = req.params;
      
      const result = await FileService.deleteFile(category, filename);
      
      if (result.success) {
        res.json({
          responseCode: 'S',
          responseMessage: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          responseCode: 'E',
          responseMessage: result.error
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/files/cleanup/:category
  static async cleanupFiles(req, res) {
    try {
      const { category } = req.params;
      const { maxAge } = req.body; // In milliseconds
      
      const result = await FileService.cleanupOldFiles(category, maxAge);
      
      res.json({
        responseCode: result.success ? 'S' : 'E',
        responseMessage: result.success ? 
          `Cleaned up ${result.deletedCount} files` : 
          result.error,
        data: result.success ? { deletedCount: result.deletedCount } : null
      });
    } catch (error) {
      console.error('Error cleaning up files:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }
}

module.exports = FileController;