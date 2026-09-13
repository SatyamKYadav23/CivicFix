const fs = require('fs');
const path = require('path');
const StorageInterface = require('./storage.interface');

/**
 * Local Disk Storage Provider
 * Saves files into uploads/complaints directory and serves via Express static
 */
class LocalStorageService extends StorageInterface {
  constructor(baseUploadDir = path.resolve(__dirname, '../../../uploads/complaints')) {
    super();
    this.baseUploadDir = baseUploadDir;
    // Ensure upload directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * Process Multer uploaded file into evidence metadata
   * @param {object} file - Multer file object
   * @returns {Promise<object>}
   */
  async upload(file) {
    if (!file) return null;

    const publicUrl = `/uploads/complaints/${file.filename}`;

    return {
      url: publicUrl,
      publicId: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a local file
   * @param {string} filename - Filename inside uploads/complaints
   */
  async delete(filename) {
    if (!filename) return false;
    const filePath = path.join(this.baseUploadDir, path.basename(filename));

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch (err) {
      console.warn(`[LocalStorage] Failed to delete file: ${filePath}`, err.message);
    }
    return false;
  }

  /**
   * Get public URL for a file
   */
  getUrl(filename) {
    return `/uploads/complaints/${path.basename(filename)}`;
  }
}

module.exports = LocalStorageService;

