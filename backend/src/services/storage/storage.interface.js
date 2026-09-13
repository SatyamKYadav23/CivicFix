/**
 * Storage Service Interface
 * Abstract contract for file storage providers (Local Disk, Cloudinary, AWS S3, etc.)
 */
class StorageInterface {
  /**
   * Process and store an uploaded file
   * @param {object} file - Multer file object
   * @param {object} [options] - Additional provider-specific options
   * @returns {Promise<{ url: string, publicId: string, originalName: string, mimeType: string, size: number, uploadedAt: string }>}
   */
  async upload(file, options = {}) {
    throw new Error('Method upload() must be implemented by concrete storage provider.');
  }

  /**
   * Delete a stored file
   * @param {string} publicId - Storage identifier or filename
   * @returns {Promise<boolean>}
   */
  async delete(publicId) {
    throw new Error('Method delete() must be implemented by concrete storage provider.');
  }

  /**
   * Get public access URL for a stored file
   * @param {string} publicId
   * @returns {string}
   */
  getUrl(publicId) {
    throw new Error('Method getUrl() must be implemented by concrete storage provider.');
  }
}

module.exports = StorageInterface;

