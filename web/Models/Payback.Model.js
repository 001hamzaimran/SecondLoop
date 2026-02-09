import mongoose from "mongoose";

const PaybackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    orderId: {
      type: String,
    },

    productName: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },

    // Payback.Model.js
    approvedGiftCardId: {
      type: String,
    },

    quantity: {
      type: Number,
    },

    hasBox: {
      type: Boolean,
      default: false,
    },

    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "good",
      required: true,
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected"]
    },

    giftCardCode: {
      type: String,
    },

    approvedCode: {
      type: String,
    },

    approvedPrice: {
      type: Number,
    },

    // NEW: percentage (0-100) that admin sets when approving
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // OPTIONAL: persist shopify customer gid for faster future requests
    customerId: {
      type: String,
      sparse: true
    },

    shopifyCustomerId: {
      type: String,
      sparse: true
    },

    approvedAt: {
      type: Date,
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 3 && arr.length <= 8,
        message: "Images must be between 3 and 8",
      },
    },

    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payback", PaybackSchema);
