// // Controller/GiftCard.Controller.js - CORRECTED VERSION
// import PaybackModel from "../Models/Payback.Model.js";
// import shopify from "../shopify.js";

// export const createGiftCardForCustomer = async (req, res) => {
//   try {
//     const { id, amount, message, paymentMethod, } = req.body;


//     if (!id) return res.status(400).json({ success: false, message: "id is required" });
//     if (amount === undefined || amount === null) return res.status(400).json({ success: false, message: "amount is required" });

//     const payback = await PaybackModel.findById(id);
//     if (!payback) return res.status(404).json({ success: false, message: "Payback request not found" });

//     const session = res.locals?.shopify?.session;
//     if (!session) {
//       console.error("Shopify session missing");
//       return res.status(401).json({ success: false, message: "Shopify authentication required" });
//     }

//     const client = new shopify.api.clients.Graphql({ session });

//     // ✅ CORRECTED GRAPHQL MUTATION
//     const gql = `
//       mutation giftCardCreate($input: GiftCardCreateInput!) {
//   giftCardCreate(input: $input) {
//     giftCard {
//       id
//       maskedCode
//       balance {
//         amount
//         currencyCode
//       }
//       expiresOn
//       customer {
//         id
//         email
//       }
//     }
//     userErrors {
//       field
//       message
//     }
//   }
// }
//     `;

//     // ✅ CORRECT VARIABLES FOR LATEST API
//     const variables = {
//       input: {
//         initialValue: String(amount),

//         // ✅ NEW WAY (CORRECT):
//         note: message || `Your Gift Card of PKR ${amount} has been issued.`,
//         customerId: `gid://shopify/Customer/${payback?.shopifyCustomerId}` || null, // Optional: if you have customer GID
//         // sendNotification: true, // ✅ THIS sends email automatically!

//         // Optional additional fields:
//         expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
//         // enabled: true
//       }
//     };

//     console.log('Creating gift card with variables:', JSON.stringify(variables, null, 2));

//     const response = await client.query({ data: { query: gql, variables } });

//     const payload = response?.body?.data?.giftCardCreate;
//     if (!payload) {
//       console.error("Invalid Shopify response:", response?.body);
//       return res.status(500).json({ success: false, message: "Invalid response from Shopify" });
//     }

//     if (payload.userErrors && payload.userErrors.length) {
//       console.error("Shopify user errors:", payload.userErrors);
//       return res.status(500).json({
//         success: false,
//         message: "Shopify error: " + payload.userErrors.map(u => u.message).join(" | "),
//         errors: payload.userErrors
//       });
//     }

//     // Success - update payback
//     payback.status = "approved";
//     payback.approvedPrice = Number(amount);
//     payback.approvedAt = new Date();
//     payback.approvedGiftCardId = payload.giftCard?.id; // giftCardCode
//     payback.paymentMethod = paymentMethod;

//     if (payload.giftCardCode) {
//       payback.approvedCode = payload.giftCardCode;
//       console.log('Gift card code generated:', payload.giftCardCode);
//     }

//     await payback.save();

//     return res.status(200).json({
//       success: true,
//       message: `Gift card created successfully! ${payload.giftCardCode ? 'Code: ' + payload.giftCardCode : ''}`,
//       data: {
//         payback: payback.toObject(),
//         giftCard: payload.giftCard,
//         giftCardCode: payload.giftCardCode,
//         note: "Email will be sent automatically by Shopify"
//       }
//     });
//   } catch (err) {
//     console.error("createGiftCardForCustomer error:", err);

//     // Detailed error logging
//     if (err.response) {
//       console.error("Shopify Response:", err.response);
//     }
//     if (err.body) {
//       console.error("Shopify Body:", err.body);
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create gift card",
//       error: err.message,
//       details: err.body?.errors || err.response?.errors
//     });
//   }
// };

// =======================================================================================

import PaybackModel from "../Models/Payback.Model.js";
import shopify from "../shopify.js";

export const createGiftCardForCustomer = async (req, res) => {
  try {
    const { id, amount, message, paymentMethod } = req.body;

    // ✅ validations
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: "amount is required" });
    }

    const payback = await PaybackModel.findById(id);
    if (!payback) {
      return res.status(404).json({ success: false, message: "Payback request not found" });
    }

    const session = res.locals?.shopify?.session;
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Shopify authentication required",
      });
    }

    const client = new shopify.api.clients.Graphql({ session });

    // ✅ SAFE customerId handling
    const rawCustomerId = payback.shopifyCustomerId;

    let customerGid = null;

    if (rawCustomerId) {
      if (String(rawCustomerId).startsWith("gid://shopify/Customer/")) {
        customerGid = String(rawCustomerId);
      } else {
        customerGid = `gid://shopify/Customer/${String(rawCustomerId)}`;
      }
    }

    console.log("Customer GID:", customerGid);

    // ✅ GraphQL mutation
    const gql = `
      mutation giftCardCreate($input: GiftCardCreateInput!) {
        giftCardCreate(input: $input) {
          giftCard {
            id
            customer {
              id
            }
            expiresOn
            note
            initialValue {
              amount
            }
          }
          giftCardCode
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    // ✅ common input builder
    const baseInput = {
      initialValue: String(amount),
      note: message || `Your Gift Card of ${amount} has been issued.`,
      expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    };

    let payload;

    try {
      // ✅ FIRST TRY (with customerId if exists)
      const input = {
        ...baseInput,
        ...(customerGid ? { customerId: customerGid } : {}),
      };

      console.log("Creating gift card with input:", input);

      const response = await client.query({
        data: { query: gql, variables: { input } },
      });

      payload = response?.body?.data?.giftCardCreate;

      if (!payload) {
        throw new Error("Invalid Shopify response");
      }

      if (payload.userErrors?.length) {
        throw new Error(payload.userErrors.map((u) => u.message).join(" | "));
      }

    } catch (err) {
      console.warn("⚠️ First attempt failed, retrying WITHOUT customerId...");
      console.error("Error:", err.message);

      // ✅ FALLBACK (WITHOUT customerId)
      const fallbackInput = {
        ...baseInput,
      };

      const retryResponse = await client.query({
        data: { query: gql, variables: { input: fallbackInput } },
      });

      payload = retryResponse?.body?.data?.giftCardCreate;

      if (!payload) {
        return res.status(500).json({
          success: false,
          message: "Invalid response from Shopify (retry failed)",
        });
      }

      if (payload.userErrors?.length) {
        return res.status(400).json({
          success: false,
          message: payload.userErrors.map((u) => u.message).join(" | "),
          errors: payload.userErrors,
        });
      }
    }

    // ✅ SUCCESS → update DB
    payback.status = "approved";
    payback.approvedPrice = Number(amount);
    payback.approvedAt = new Date();
    payback.approvedGiftCardId = payload.giftCard?.id;
    payback.approvedCode = payload.giftCardCode || null;
    payback.paymentMethod = paymentMethod;

    await payback.save();

    console.log("✅ Gift card created:", payload.giftCardCode);

    return res.status(200).json({
      success: true,
      message: "Gift card created successfully",
      data: {
        payback: payback.toObject(),
        giftCard: payload.giftCard,
        giftCardCode: payload.giftCardCode,
      },
    });

  } catch (err) {
    console.error("❌ createGiftCardForCustomer error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create gift card",
      error: err.message,
      details: err.body?.errors || err.response?.errors,
    });
  }
};