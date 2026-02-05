// Controller/PaybackForm.Controller.js
import PaybackModel from "../Models/Payback.Model.js";
import cloudinary from "../config/cloudnary.js";
import fs from "fs";
import path from "path";

import { createShopifyCodeForCustomer } from "./Discount.Controller.js";
import { sendDiscountEmail } from "../Middleware/EmailCode.Config.js";

const createPaybackForm = async (req, res) => {
  try {
    const {
      name,
      email,
      order_id,
      product,
      product_id,
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
      productId: product_id,
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

// ============================== working code ==================

// const updateStatusPaybackForm = async (req, res) => {
//   try {
//     const { id, status } = req.body;

//     // Validate status
//     if (!["pending", "approved", "rejected"].includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid status" });
//     }

//     const payback = await PaybackModel.findById(id);
//     if (!payback) {
//       return res.status(404).json({ success: false, message: "Payback not found" });
//     }

//     // if already same status, just return
//     if (payback.status === status) {
//       return res.status(200).json({ success: true, message: "No change needed", data: payback });
//     }

//     // Update status field
//     payback.status = status;

//     if (status === "approved") {
//       // Prepare options: you can set percentage rule and minPrice here or based on other DB config
//       const options = {
//         percentage: 100, // or pick from config/threshold
//         minPrice: payback.basePrice || 0,
//         usageLimit: 1,
//         endDays: 14
//       };

//       // Use shopify session provided by middleware (validateAuthenticatedSession sets it)
//       const session = res.locals?.shopify?.session;
//       try {
//         const result = await createShopifyCodeForCustomer(session, payback, options);
//         if (result?.success) {
//           const code = result.code;
//           payback.approvedCode = code;
//           payback.approvedPrice = options.percentage === 100 ? payback.basePrice : options.percentage/100 * payback.basePrice;
//           payback.approvedAt = new Date();

//           // send email
//           try {
//             await sendDiscountEmail({
//               to: payback.email,
//               code,
//               amount: payback.approvedPrice,
//               productName: payback.productName
//             });
//           } catch (emailErr) {
//             console.error("Email send failed:", emailErr);
//             // don't fail the whole process for email failure — but include the note
//           }
//         } else {
//           // if shopify failed, you may decide to rollback status -> pending. For now we will keep status=approved
//           console.warn("Shopify code creation did not succeed:", result);
//         }
//       } catch (err) {
//         console.error("Shopify discount creation error:", err);
//         // You can choose to rollback status or set a flag on payback; here we'll set an error field:
//         payback.approvedCode = null;
//       }
//     }

//     await payback.save();

//     return res.status(200).json({
//       success: true,
//       message: "Status updated successfully",
//       data: payback,
//     });
//   } catch (error) {
//     console.error("Update status error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };

// ====================testing

const updateStatusPaybackForm = async (req, res) => {
  try {
    console.log("=== UPDATE PAYBACK STATUS REQUEST ===");
    console.log("Request Body:", req.body);
    console.log("Session:", res.locals?.shopify?.session?.shop);

    const { id, status, approvedPrice: approvedPriceFromReq, percentage: percentageFromReq } = req.body;

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

      // Prepare discount options
      // const options = {
      //   percentage: 100,
      //   minPrice: payback.basePrice || 0,
      //   usageLimit: 1,
      //   endDays: 14
      // };

      // Determine percentage (0-100). If frontend provided percentage use it, otherwise default 100.
      const percentage = Number(percentageFromReq ?? 100);
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ success: false, message: "percentage must be a number between 0 and 100" });
      }

      // Determine final approvedPrice:
      let finalPrice;
      if (approvedPriceFromReq !== undefined && approvedPriceFromReq !== null && approvedPriceFromReq !== "") {
        finalPrice = Number(approvedPriceFromReq);
        if (Number.isNaN(finalPrice) || finalPrice < 0) {
          return res.status(400).json({ success: false, message: "approvedPrice must be a valid number" });
        }
      } else {
        // compute from percentage
        finalPrice = Math.round((percentage / 100) * (payback.basePrice || 0));
      }

      // Build options for discount creation
      const options = {
        percentage: percentageFromReq,
        minPrice: 1, // optionally you can set floor here
        usageLimit: 1,
        endDays: 14
      };

      // Get Shopify session
      const session = res.locals?.shopify?.session;
      if (!session) {
        console.error("Shopify session not found in res.locals");
        return res.status(401).json({
          success: false,
          message: "Shopify authentication required"
        });
      }

      let shopifyResult;
      try {
        console.log("Creating Shopify discount code for customer:", payback.email, "options:", options);
        shopifyResult = await createShopifyCodeForCustomer(session, payback, options);

        if (shopifyResult?.success) {
          const code = shopifyResult.code;
          console.log("✅ Shopify discount created:", code);

          // Update payback with approved data
          payback.status = "approved";
          payback.approvedCode = code;
          payback.approvedPrice = options.percentage === 100
            ? payback.basePrice
            : (options.percentage / 100) * payback.basePrice;
            payback.percentage = options.percentage;
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
            productName: payback.productName
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
