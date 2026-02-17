import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
    {
        storeName: {
            type: String,
        },
        email: {
            type: String,
        },
        domain: {
            type: String,
            required: true,
            unique: true, // important: one store = one record
        },
        country: {
            type: String,
        },
        currencyCode: {
            type: String
        },
        user_id: {
            type: String, // Shopify shop owner ID
        },
    },
    {
        timestamps: true, // automatically adds createdAt & updatedAt
    }
);

const Store = mongoose.model("Store", storeSchema);
export default Store;
