import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Define where to store the uploaded images
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: timestamp-random.webp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max (client handles compression down to ~300kb anyway)
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/webp' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// The POST endpoint expects a single file named 'image'
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // Return the public URL for the image
        const imageUrl = `/uploads/products/${req.file.filename}`;

        return res.status(200).json({
            success: true,
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

export default router;
