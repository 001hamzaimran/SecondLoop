// // Services/discountService.js
// import shopify from "../shopify.js"; // your existing shopify client import

// function generateSmartCode() {
//   const words = ["FAST", "SAFE", "CODE", "USER", "PRO", "GOLD"];
//   const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
//   const randomWord = words[Math.floor(Math.random() * words.length)];
//   const randomChar = letters[Math.floor(Math.random() * letters.length)];
//   const randomNum = Math.floor(100000 + Math.random() * 900000);
//   return `${randomWord}${randomChar}${randomNum}`;
// }

// export async function createShopifyCodeForCustomer(session, payback, options = {}) {
//   if (!session) throw new Error("Shopify session is required");
//   if (!payback || !payback.email) throw new Error("Payback with email is required");

//   const client = new shopify.api.clients.Graphql({ session });

//   try {
//     const generatedCode = generateSmartCode();
//     const startsAt = new Date().toISOString();

//     const {
//       amount = 0,
//       minPrice = 1,
//       usageLimit = 1,
//       endDays = 60,
//     } = options;

//     if (!amount || Number(amount) <= 0) {
//       throw new Error("Valid discount amount is required");
//     }

//     const endsAtDate = new Date();
//     endsAtDate.setDate(endsAtDate.getDate() + Number(endDays));
//     const endsAt = endsAtDate.toISOString();

//     const customerGid = payback.shopifyCustomerId || payback.customerAdminGid || null;



//     const basicInput = {
//       title: `${generatedCode} Discount`,
//       // NOTE: Shopify doesn't echo the 'code' field in DiscountCodeBasic type in some API versions,
//       // but we still create the code value locally and send it in the input.
//       code: generatedCode,
//       startsAt,
//       endsAt,
//       customerGets: {
//         value: {
//           discountAmount: {
//             amount: String(Number(amount).toFixed(2)), // MUST be string
//             appliesOnEachItem: false
//           }
//         },
//         items: { all: true },
//       },
//       minimumRequirement: {
//         subtotal: {
//           greaterThanOrEqualToSubtotal: String(Number(minPrice || 0).toFixed(2)),
//         },
//       },
//       usageLimit: Number(usageLimit || 1),
//       appliesOncePerCustomer: true,
//       customerSelection: { all: true }
//     };

//     // if (customerGid) {
//     //   basicInput.customerSelection = {
//     //     customers: { add: [customerGid] },
//     //   };
//     // }

//     // NOTE: Removed `code` field from selection because it does not exist on DiscountCodeBasic
//     const mutation = `
//       mutation CreateDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
//         discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
//           codeDiscountNode {
//             id
//             codeDiscount {
//               ... on DiscountCodeBasic {
//                 title
//                 startsAt
//                 endsAt
//                 customerSelection {
//                   ... on DiscountCustomers {
//                     customers { id }
//                   }
//                 }
//                 customerGets {
//                   value {
//                     ... on DiscountPercentage {
//                       amount {
//                         amount
//                         currencyCode
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     const variables = { basicCodeDiscount: basicInput };

//     const response = await client.query({
//       data: { query: mutation, variables },
//     });

//     const result = response?.body?.data?.discountCodeBasicCreate;

//     if (!result) {
//       console.error("❌ INVALID SHOPIFY RESPONSE 👉", response?.body);
//       throw new Error("Invalid response from Shopify when creating discount code");
//     }

//     if (result.userErrors && result.userErrors.length) {
//       console.error("❌ SHOPIFY USER ERRORS 👉", result.userErrors);
//       throw new Error(result.userErrors.map((u) => u.message).join(" | "));
//     }

//     // Success — return the locally generated code (this is the actual code sent to Shopify)
//     return {
//       success: true,
//       code: generatedCode,
//       shopifyResponse: result,
//     };
//   } catch (error) {
//     // full debug logging
//     console.error("🔥 FULL ERROR 👉", JSON.stringify(error, null, 2));
//     if (error.response?.errors) console.error("🔥 GRAPHQL ERRORS 👉", error.response.errors);
//     if (error.response?.errors?.graphQLErrors) console.error("🔥 GRAPHQL ERRORS DETAILS 👉", error.response.errors.graphQLErrors);
//     if (error.body?.errors) console.error("🔥 RESPONSE BODY ERRORS 👉", error.body.errors);
//     throw error;
//   }
// }

// Services/discountService.js
import shopify from "../shopify.js"; // your existing shopify client import

function generateSmartCode() {
  const words = ["FAST", "SAFE", "CODE", "USER", "PRO", "GOLD"];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomChar = letters[Math.floor(Math.random() * letters.length)];
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${randomWord}${randomChar}${randomNum}`;
}

export async function createShopifyCodeForCustomer(session, payback, options = {}) {
  if (!session) throw new Error("Shopify session is required");
  if (!payback || !payback.email) throw new Error("Payback with email is required");

  const client = new shopify.api.clients.Graphql({ session });

  try {
    const generatedCode = generateSmartCode();
    const startsAt = new Date().toISOString();

    const {
      amount = 0,
      minPrice = 0,
      usageLimit = 1,
      endDays = 60,
    } = options;

    // validate amount
    if (!amount || Number(amount) <= 0) {
      throw new Error("Valid discount amount is required");
    }

    const endsAtDate = new Date();
    endsAtDate.setDate(endsAtDate.getDate() + Number(endDays));
    const endsAt = endsAtDate.toISOString();

    const customerGid = payback.shopifyCustomerId || payback.customerAdminGid || null;

    // Shopify expects money fields as strings with decimal places
    const amountStr = String(Number(amount).toFixed(2));
    const minPriceStr = String(Number(minPrice || 0).toFixed(2));

    const basicInput = {
      title: `${generatedCode} Discount`,
      // sending `code` is fine; some API versions don't echo it back but it is used.
      code: generatedCode,
      startsAt,
      endsAt,
      customerGets: {
        value: {
          // FIX: use DiscountAmount shape for fixed amount discounts
          discountAmount: {
            amount: amountStr,
            appliesOnEachItem: false, // false -> subtract from order total
          },
        },
        items: { all: true },
      },
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToSubtotal: minPriceStr,
        },
      },
      usageLimit: Number(usageLimit || 1),
      appliesOncePerCustomer: true,
      customerSelection: { all: true },
    };

    // optional: restrict to specific customer
    if (customerGid) {
      // NOTE: if you want to restrict to a single customer, uncomment and adjust
      // basicInput.customerSelection = { customers: { add: [customerGid] } };
    }

    const mutation = `
      mutation CreateDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                startsAt
                endsAt
                customerSelection {
                  ... on DiscountCustomers {
                    customers { id }
                  }
                }
                customerGets {
                  value {
                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = { basicCodeDiscount: basicInput };

    const response = await client.query({
      data: { query: mutation, variables },
    });

    const result = response?.body?.data?.discountCodeBasicCreate;

    if (!result) {
      console.error("❌ INVALID SHOPIFY RESPONSE 👉", response?.body);
      throw new Error("Invalid response from Shopify when creating discount code");
    }

    if (result.userErrors && result.userErrors.length) {
      console.error("❌ SHOPIFY USER ERRORS 👉", result.userErrors);
      throw new Error(result.userErrors.map((u) => u.message).join(" | "));
    }

    // Success — return the locally generated code (this is the actual code sent to Shopify)
    return {
      success: true,
      code: generatedCode,
      shopifyResponse: result,
    };
  } catch (error) {
    // full debug logging
    console.error("🔥 FULL ERROR 👉", error);
    // try to dump GraphQL details if present
    if (error.response) console.error("Shopify response object:", error.response);
    if (error.body) console.error("Shopify body:", error.body);
    if (error?.message) console.error("Error message:", error.message);
    throw error;
  }
}
