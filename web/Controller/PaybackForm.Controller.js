// Controller/PaybackForm.Controller.js
import PaybackModel from "../Models/Payback.Model.js";
import cloudinary from "../config/cloudnary.js";
import fs from "fs";
import path from "path";

const createPaybackForm = async (req, res) => {
  try {
    const {
      name,
      email,
      order_id,
      product,
      quantity,
      base_price,
      condition,
      notes,
    } = req.body;

    // Basic validation
    if (!name || !email || !product || !base_price) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    // Files from multer
    const files = req.files || [];

    if (!Array.isArray(files) || files.length < 3 || files.length > 8) {
      // remove uploaded temp files if any
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (err) { /* ignore */ }
      });

      return res.status(400).json({
        success: false,
        message: "Please upload between 3 and 8 images",
      });
    }

    // Upload all files to Cloudinary concurrently
    const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "payback";
    const uploadedImageUrls = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: uploadFolder,
          // optional: transformations, e.g. limit to width
          // transformation: [{ width: 1200, crop: "limit" }]
        });
        return { url: result.secure_url, public_id: result.public_id, localPath: file.path };
      })
    );

    // Delete local temp files
    uploadedImageUrls.forEach(u => {
      try { fs.unlinkSync(u.localPath); } catch (err) { /* ignore */ }
    });

    const imageUrls = uploadedImageUrls.map(u => u.url);

    // Create payback entry
    const payback = await PaybackModel.create({
      name,
      email,
      orderId: order_id,
      productName: product,
      quantity: quantity ? Number(quantity) : undefined,
      basePrice: Number(base_price),
      condition: condition?.toLowerCase() || "good",
      images: imageUrls,
      description: notes,
    });

    return res.status(201).json({
      success: true,
      message: "Payback form submitted successfully",
      data: payback,
    });
  } catch (error) {
    console.error("Create Payback Error:", error);

    // best-effort cleanup when req.files present
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (err) {}
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { createPaybackForm };
