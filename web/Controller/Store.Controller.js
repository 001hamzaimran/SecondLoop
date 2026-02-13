import StoreModel from "../Models/Store.Model.js";
import shopify from "../shopify.js";

export const syncStore = async (session) => {
    const client = new shopify.api.clients.Rest({ session });

    const shopData = await client.get({ path: "shop" });
    const shop = shopData.body.shop;

    const savedStore = await Store.findOneAndUpdate(
        { domain: shop.myshopify_domain },
        {
            username: shop.name,
            email: shop.email,
            domain: shop.myshopify_domain,
            country: shop.country_code,
            user_id: shop.id,
        },
        { upsert: true, new: true }
    );

    return savedStore;
};


export const getStores = async (req, res) => {
    try {
        const Store = await shopify.api.rest.Shop.all({
            session: res.locals.shopify.session,
        });
        if (Store && Store.data && Store.data.length > 0) {
            const storeName = Store.data[0].name;
            const domain = Store.data[0].domain;
            const country = Store.data[0].country;
            const Store_Id = Store.data[0].id;
            const currencyCode = Store.data[0].currency;
            const email = String(Store.data[0].customer_email);
            console.log("Store data", Store.data[0]);
            // Check if storeName exists in the database
            let existingStore = await StoreModel.findOne({ storeName });

            if (!existingStore) {
                // If it doesn't exist, save it
                const newStore = new StoreModel({
                    storeName,
                    domain,
                    country,
                    Store_Id,
                    currencyCode,
                    email
                });
                await newStore.save();
                existingStore = newStore;
            }

            // Send response with existingStore only
            return res.status(200).json(existingStore); // Send existingStore directly in the response
        } else {
            res.status(404).json({ message: "Store not found" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server Error" });
    }
};