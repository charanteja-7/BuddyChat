const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on mime type
    let resource_type = 'auto'; // allow anything
    if (file.mimetype.startsWith('image/')) {
        resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
        resource_type = 'video';
    }

    return {
      folder: 'buddychat',
      resource_type: resource_type,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4', 'pdf'],
    };
  },
});

const upload = multer({ storage });

router.post('/', protect, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Determine basic type for the UI
    let mediaType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    }

    res.status(200).json({
      success: true,
      mediaUrl: req.file.path, // Cloudinary URL
      mediaType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed', error: error.message });
  }
});

module.exports = router;
