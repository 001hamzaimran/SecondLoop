// Controller/PaybackForm.Controller.js
import PaybackModel from "../Models/Payback.Model.js";
import cloudinary from "../config/cloudnary.js";
import fs from "fs";
import path from "path";

import { createShopifyCodeForCustomer } from "./Discount.Controller.js";
import { sendDiscountEmail } from "../Middleware/EmailCode.Config.js";
import { sendCODEmail } from "../Middleware/sendCODEmail.Config.js";

const createPaybackForm = async (req, res) => {
  try {
    // NOTE: multer will put text fields in req.body
    const {
      name,
      email,
      customer_id,
      order_id,
      product,      // could be string or array (product titles)
      product_id,   // could be string or array (product ids)
      quantity,     // could be string/number or array
      base_price,   // could be string/number or array (optional)
      condition,
      notes,
    } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    // Normalize product inputs into arrays (defensive)
    const normalizeToArray = (v) => {
      if (v === undefined || v === null) return [];
      if (Array.isArray(v)) return v;
      // sometimes multer/urlencoded might present JSON strings — try to parse
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
      return [v];
    };

    const productIds = normalizeToArray(product_id);
    const productNames = normalizeToArray(product);
    const quantities = normalizeToArray(quantity);
    const basePrices = normalizeToArray(base_price);

    if (productIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one product is required" });
    }

    // Files from multer
    const files = req.files || [];
    if (!Array.isArray(files) || files.length < 3 || files.length > 8) {
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
        });
        return { url: result.secure_url, public_id: result.public_id, localPath: file.path };
      })
    );

    // Delete local temp files
    uploadedImageUrls.forEach(u => {
      try { fs.unlinkSync(u.localPath); } catch (err) { /* ignore */ }
    });
    const imageUrls = uploadedImageUrls.map(u => u.url);
    const hasBox = (req.body.has_box === "true" || req.body.has_box === true);

    // Build products array (align by index)
    const products = productIds.map((pid, idx) => {
      const nameForThis = productNames[idx] || productNames[0] || ""; // fallback to first or empty
      const qty = quantities[idx] !== undefined ? Number(quantities[idx]) : (quantities.length === 1 ? Number(quantities[0]) : undefined);
      const price = basePrices[idx] !== undefined ? Number(basePrices[idx]) : (basePrices.length === 1 ? Number(basePrices[0]) : undefined);

      return {
        productId: pid,
        productName: nameForThis,
        quantity: qty && !Number.isNaN(qty) ? qty : undefined,
        basePrice: price && !Number.isNaN(price) ? price : undefined,
      };
    });

    // As a convenience for older code, copy first product into legacy fields (if exists)
    const firstProduct = products[0] || {};
    const topLevelQuantity = (typeof quantity === "string" || typeof quantity === "number") ? Number(quantity) : undefined;

    const paybackData = {
      name,
      email,
      orderId: order_id,
      shopifyCustomerId: customer_id,
      products,
      productName: firstProduct.productName || undefined,
      productId: firstProduct.productId || undefined,
      quantity: topLevelQuantity && !Number.isNaN(topLevelQuantity) ? topLevelQuantity : undefined,
      condition: condition?.toLowerCase() || "good",
      images: imageUrls,
      description: notes,
      hasBox: hasBox,
    };

    const payback = await PaybackModel.create(paybackData);

    return res.status(201).json({
      success: true,
      message: "Payback form submitted successfully",
      data: payback,
    });
  } catch (error) {
    console.error("Create Payback Error:", error);

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (err) { }
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


const getDataPaybackForm = async (req, res) => {
  try {
    const paybackFormData = await PaybackModel.find({});
    res.status(200).json({
      success: true,
      data: paybackFormData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
}

const updateStatusPaybackForm = async (req, res) => {
  try {
    console.log("=== UPDATE PAYBACK STATUS REQUEST ===");
    console.log("Request Body:", req.body);
    console.log("Session:", res.locals?.shopify?.session?.shop);

    const { id, status, approvedPrice: approvedPriceFromReq, paymentMethod, store, } = req.body;
    let finalPrice;
    if (status === "approved") {
      if (approvedPriceFromReq === undefined) {
        return res.status(400).json({
          success: false,
          message: "approvedPrice is required for approval"
        });
      }
      finalPrice = Number(approvedPriceFromReq);
      if (Number.isNaN(finalPrice) || finalPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "approvedPrice must be a valid number"
        });
      }
    }

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, approved, or rejected"
      });
    }

    // Find payback request
    const payback = await PaybackModel.findById(id);

    if (!payback) {
      return res.status(404).json({
        success: false,
        message: "Payback request not found"
      });
    }

    console.log("Found Payback:", {
      id: payback._id,
      currentStatus: payback.status,
      requestedStatus: status,
      email: payback.email,
      product: payback.productName
    });

    // If already same status, just return
    if (payback.status === status) {
      return res.status(200).json({
        success: true,
        message: "Status is already set to " + status,
        data: payback
      });
    }

    // Handle different status changes
    if (status === "approved") {
      // =================== APPROVED FLOW ===================
      console.log("Starting approval process...");

      // Build options for discount creation
      const options = {
        amount: finalPrice,
        minPrice: 1, // optionally you can set floor here
        usageLimit: 1,
        endDays: 60
      };



      let shopifyResult;
      try {
        if (paymentMethod === 'cod') {
          payback.status = 'approved';
          payback.approvedPrice = finalPrice;
          payback.paymentMethod = 'cod';
          payback.approvedAt = new Date();
          await payback.save();

          // send COD email
          await sendCODEmail({
            to: payback.email,
            amount: finalPrice,
            name: payback.name,
            paybackId: payback._id,
            store
          }).catch(err => {
            console.error("COD email send failed", err);
            // optionally update DB with emailError
          });

          return res.status(200).json({
            success: true,
            message: "Request approved (COD). User notified by email.",
            data: payback
          });
        }

        // Get Shopify session
        const session = res.locals?.shopify?.session;
        if (!session) {
          console.error("Shopify session not found in res.locals");
          return res.status(401).json({
            success: false,
            message: "Shopify authentication required"
          });
        }

        console.log("Creating Shopify discount code for customer:", payback.email, "options:", options);
        shopifyResult = await createShopifyCodeForCustomer(session, payback, options);

        if (shopifyResult?.success) {
          const code = shopifyResult.code;
          console.log("✅ Shopify discount created:", code);

          // Update payback with approved data
          payback.status = "approved";
          payback.approvedCode = code;
          payback.approvedPrice = finalPrice;
          payback.paymentMethod = 'discount';
          payback.approvedAt = new Date();
          payback.updatedAt = new Date();

          // Save to database FIRST
          await payback.save();
          console.log("✅ Payback saved to database");

          // Then send email (async - don't wait for it)
          console.log("Sending email to:", payback.email);
          sendDiscountEmail({
            to: payback.email,
            code,
            amount: payback.approvedPrice,
            productName: payback.productName,
            store
          })
            .then(emailInfo => {
              console.log("✅ Email sent successfully:", {
                messageId: emailInfo.messageId,
                to: payback.email,
                code: code
              });

              // Optional: Update email sent status in DB
              PaybackModel.findByIdAndUpdate(id, {
                emailSent: true,
                emailSentAt: new Date()
              }, { new: true }).catch(err =>
                console.error("Error updating email status:", err)
              );
            })
            .catch(emailError => {
              console.error("❌ Email sending failed:", {
                error: emailError.message,
                to: payback.email,
                code: code
              });

              // Log error but don't fail the approval
              PaybackModel.findByIdAndUpdate(id, {
                emailError: emailError.message
              }, { new: true }).catch(err =>
                console.error("Error saving email error:", err)
              );
            });

          return res.status(200).json({
            success: true,
            message: `Request approved! Discount code ${code} has been created. Email sent to ${payback.email}`,
            data: {
              ...payback.toObject(),
              discountCode: code,
              emailQueued: true
            }
          });

        } else {
          console.error("Shopify discount creation failed:", shopifyResult);

          // Rollback: Don't approve if discount creation failed
          return res.status(500).json({
            success: false,
            message: "Failed to create discount code on Shopify",
            error: shopifyResult?.error || "Unknown Shopify error"
          });
        }

      } catch (shopifyError) {
        console.error("❌ Shopify error:", {
          message: shopifyError.message,
          stack: shopifyError.stack
        });

        // Log detailed Shopify error
        if (shopifyError.response) {
          console.error("Shopify Response:", shopifyError.response);
        }
        if (shopifyError.body) {
          console.error("Shopify Body:", shopifyError.body);
        }

        return res.status(500).json({
          success: false,
          message: "Shopify discount creation failed",
          error: shopifyError.message,
          details: shopifyError.body?.errors || shopifyError.response?.errors
        });
      }

    } else if (status === "rejected") {
      // =================== REJECTED FLOW ===================
      console.log("Rejecting payback request...");

      payback.status = "rejected";
      payback.rejectedAt = new Date();
      payback.updatedAt = new Date();

      await payback.save();

      console.log("✅ Request rejected successfully");

      return res.status(200).json({
        success: true,
        message: "Request has been rejected",
        data: payback
      });

    } else {
      // =================== PENDING FLOW ===================
      console.log("Setting status to pending...");

      payback.status = "pending";
      payback.updatedAt = new Date();
      payback.approvedCode = undefined;
      payback.approvedPrice = undefined;
      payback.approvedAt = undefined;

      await payback.save();

      console.log("✅ Status set to pending");

      return res.status(200).json({
        success: true,
        message: "Status updated to pending",
        data: payback
      });
    }

  } catch (error) {
    console.error("❌ Update status error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating status",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export { createPaybackForm, getDataPaybackForm, updateStatusPaybackForm };
