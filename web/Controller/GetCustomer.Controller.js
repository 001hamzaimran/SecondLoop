// import shopify from "../shopify";


// export const getCustomer = async (req, res) => {
// try {
//     // Shopify session se customer details get karo
//     const session = res.locals.shopify.session;
//     const client = new shopify.api.clients.Graphql({ session });
    
//     const response = await client.query({
//       data: `query {
//         customer {
//           id
//           firstName
//           lastName
//           email
//           phone
//         }
//       }`
//     });
    
//     res.json(response.body.data.customer);
//     console.log(response.body.data.customer ,"<<<<< current login user")
//   } catch (error) {
//     console.error('Customer fetch error:', error);
//     res.status(401).json({ error: 'Customer not logged in' });
//   }
// }

// Controller/GetCustomer.Controller.js
import shopify from "../shopify.js";

export const getCustomer = async (req, res) => {
  try {
    // get shop from query or header (frontend should include shop via Shopify.shop)
    const shop = req.query.shop || req.headers["x-shopify-shop-domain"] || (res.locals?.shopify?.session?.shop);
    if (!shop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    // get customer id numeric (frontend should send this); allow header or query
    const customerId = req.query.customer_id || req.headers["x-customer-id"];
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Missing customer_id" });
    }

    // Build offline session id and load it
    const offlineSessionId = shopify.api.session.getOfflineId(shop);
    const session = await shopify.api.sessionStorage.loadSession(offlineSessionId);
    if (!session) {
      return res.status(401).json({ success: false, message: "Offline session not found. App not installed for this shop?" });
    }

    // Use Admin GraphQL client and query customer by GID
    const client = new shopify.api.clients.Graphql({ session });

    const gid = `gid://shopify/Customer/${customerId}`;

    const query = `
      query getCustomer($id: ID!) {
        customer(id: $id) {
          id
          firstName
          lastName
          email
          phone
          displayName
        }
      }
    `;

    // Use client.request (newer API)
    const response = await client.request({
      data: query,
      variables: { id: gid }
    });

    // response may live in response.body.data depending on SDK version:
    const customer = response?.body?.data?.customer || response?.data?.customer;

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // success
    return res.json({ success: true, data: customer });
  } catch (error) {
    console.error("GetCustomer error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
