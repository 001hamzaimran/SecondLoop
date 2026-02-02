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

    quantity: {
      type: Number,
    },

    basePrice: {
      type: Number,
      required: true,
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

    approvedCode: {
      type: String,
    },

    approvedPrice: {
      type: Number,
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
