// // Controller/GiftCard.Controller.js
// import PaybackModel from "../Models/Payback.Model.js";
// import shopify from "../shopify.js"; // your shopify config (same import style as discountService)
// import { sendDiscountEmail } from "../Middleware/EmailCode.Config.js"; // optional if you want to record email status

// export const createGiftCardForCustomer = async (req, res) => {
//   try {
//     const { id, amount, message } = req.body;

//     if (!id) return res.status(400).json({ success: false, message: "id is required" });
//     if (amount === undefined || amount === null) return res.status(400).json({ success: false, message: "amount is required" });

//     const payback = await PaybackModel.findById(id);
//     if (!payback) return res.status(404).json({ success: false, message: "Payback request not found" });

//     // session must be provided by your shopify auth middleware (you already use it in updateStatusPaybackForm)
//     const session = res.locals?.shopify?.session;
//     if (!session) {
//       console.error("Shopify session missing in res.locals");
//       return res.status(401).json({ success: false, message: "Shopify authentication required" });
//     }

//     // create GraphQL client using new API
//     const client = new shopify.api.clients.Graphql({ session });

//     const gql = `
//       mutation giftCardCreate($input: GiftCardCreateInput!) {
//         giftCardCreate(input: $input) {
//           giftCard {
//             id
//             maskedCode
//             balance {
//               amount
//               currencyCode
//             }
//             initialValue {
//               amount
//               currencyCode
//             }
//             enabled
//             createdAt
//             expiresOn
//           }
//           giftCardCode
//           userErrors {
//             field
//             message
//             code
//           }
//         }
//       }
//     `;

//     // recipientAttributes ensures Shopify sends the email to the recipient
//     const variables = {
//       input: {
//         initialValue: String(amount), // string is fine
//         recipientAttributes: {
//           email: payback.email,
//            note: message || `Your trade-in credit of PKR ${amount} has been issued.`,
//           firstName: payback.name
//           // you may add sendNotificationAt if you want scheduling
//         },
//         // optional: assign to customer by GID if you have it
//         // customerId: payback.shopifyCustomerId || undefined,
//         // optional flags
//         note: `Issued via tradein:${payback._id}`
//       }
//     };

//     const response = await client.query({ data: { query: gql, variables } });

//     const payload = response?.body?.data?.giftCardCreate;
//     if (!payload) {
//       console.error("Invalid Shopify response:", response?.body);
//       return res.status(500).json({ success: false, message: "Invalid response from Shopify" });
//     }

//     if (payload.userErrors && payload.userErrors.length) {
//       console.error("Shopify user errors:", payload.userErrors);
//       return res.status(500).json({ success: false, message: "Shopify user error: " + payload.userErrors.map(u => u.message).join(" | ") });
//     }

//     // Success — update payback doc
//     payback.status = "approved";
//     payback.approvedPrice = Number(amount);
//     payback.approvedAt = new Date();
//     // store gift card id (if available)
//     payback.approvedGiftCardId = payload.giftCard?.id;
//     // optionally save giftCardCode if returned (may be undefined for security)
//     if (payload.giftCardCode) {
//       payback.approvedCode = payload.giftCardCode;
//     } else {
//       payback.approvedCode = undefined; // or keep previous
//     }
//     await payback.save();

//     // Note: Shopify will send the email to payback.email automatically because we passed recipientAttributes
//     // Optionally persist email-sent flag — but since Shopify handles it, we don't send our own email by default.

//     return res.status(200).json({
//       success: true,
//       message: `Gift card created and email queued to ${payback.email}`,
//       data: {
//         payback: payback.toObject(),
//         shopifyPayload: payload
//       }
//     });
//   } catch (err) {
//     console.error("createGiftCardForCustomer error:", err);
//     return res.status(500).json({ success: false, message: err.message, details: err });
//   }
// };


// Controller/GiftCard.Controller.js - CORRECTED VERSION
import PaybackModel from "../Models/Payback.Model.js";
import shopify from "../shopify.js";

export const createGiftCardForCustomer = async (req, res) => {
  try {
    const { id, amount, message } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "id is required" });
    if (amount === undefined || amount === null) return res.status(400).json({ success: false, message: "amount is required" });

    const payback = await PaybackModel.findById(id);
    if (!payback) return res.status(404).json({ success: false, message: "Payback request not found" });

    const session = res.locals?.shopify?.session;
    if (!session) {
      console.error("Shopify session missing");
      return res.status(401).json({ success: false, message: "Shopify authentication required" });
    }

    const client = new shopify.api.clients.Graphql({ session });

    // ✅ CORRECTED GRAPHQL MUTATION
    const gql = `
      mutation giftCardCreate($input: GiftCardCreateInput!) {
        giftCardCreate(input: $input) {
          giftCard {
            id
            maskedCode
            balance {
              amount
              currencyCode
            }
            initialValue {
              amount
              currencyCode
            }
            enabled
            createdAt
            expiresOn
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

    // ✅ CORRECT VARIABLES FOR LATEST API
    const variables = {
      input: {
        initialValue: String(amount),
        // ❌ OLD WAY (WRONG):
        // recipientAttributes: {
        //   email: payback.email,
        //   note: message,
        //   firstName: payback.name
        // },

        // ✅ NEW WAY (CORRECT):
        note: message || `Your trade-in credit of PKR ${amount} has been issued.`,
        customerId: payback.customerId || null, // Optional: if you have customer GID
        sendNotification: true, // ✅ THIS sends email automatically!

        // Optional additional fields:
        expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        enabled: true
      }
    };

    console.log('Creating gift card with variables:', JSON.stringify(variables, null, 2));

    const response = await client.query({ data: { query: gql, variables } });

    const payload = response?.body?.data?.giftCardCreate;
    if (!payload) {
      console.error("Invalid Shopify response:", response?.body);
      return res.status(500).json({ success: false, message: "Invalid response from Shopify" });
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("Shopify user errors:", payload.userErrors);
      return res.status(500).json({
        success: false,
        message: "Shopify error: " + payload.userErrors.map(u => u.message).join(" | "),
        errors: payload.userErrors
      });
    }

    // Success - update payback
    payback.status = "approved";
    payback.approvedPrice = Number(amount);
    payback.approvedAt = new Date();
    payback.approvedGiftCardId = payload.giftCard?.id;

    if (payload.giftCardCode) {
      payback.approvedCode = payload.giftCardCode;
      console.log('Gift card code generated:', payload.giftCardCode);
    }

    await payback.save();

    return res.status(200).json({
      success: true,
      message: `Gift card created successfully! ${payload.giftCardCode ? 'Code: ' + payload.giftCardCode : ''}`,
      data: {
        payback: payback.toObject(),
        giftCard: payload.giftCard,
        giftCardCode: payload.giftCardCode,
        note: "Email will be sent automatically by Shopify"
      }
    });
  } catch (err) {
    console.error("createGiftCardForCustomer error:", err);

    // Detailed error logging
    if (err.response) {
      console.error("Shopify Response:", err.response);
    }
    if (err.body) {
      console.error("Shopify Body:", err.body);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create gift card",
      error: err.message,
      details: err.body?.errors || err.response?.errors
    });
  }
};