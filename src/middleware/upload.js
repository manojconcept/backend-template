import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      if (!req.productId) {
        return cb(new Error('Product ID is missing'), false); // Fail the upload if productId is missing
      }

      const uploadDir = `uploads/${req.productId}/`;
      
      // Ensure the directory exists (use asynchronous version)
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true }); // Create directory if it doesn't exist
      }

      // Set the destination where files will be saved
      cb(null, uploadDir);
    } catch (error) {
      cb(error, false); // Handle potential errors
    }
  },
  filename: (req, file, cb) => {
    // Set the file name format
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`); // Ensure extension is lowercase
  },
});

// Filter to accept only specific file types (e.g., images only)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|svg/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Error: Images Only format jpeg, jpg, png, gif, or svg'), false); // Ensure the callback properly handles this error
  }
};

// Initialize the multer upload instance with defined storage and file filter
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5MB
  fileFilter,
});

export default upload;
