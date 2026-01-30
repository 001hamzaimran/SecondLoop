// Utils/multerConfig.js
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ensure uploads dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safeName}`);
  },
});

const maxSize = Number(process.env.MAX_IMAGE_SIZE_BYTES) || 5 * 1024 * 1024; // default 5MB

const fileFilter = (req, file, cb) => {
  // accept only image mime types
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize, files: 8 },
  fileFilter,
});

export default upload;
