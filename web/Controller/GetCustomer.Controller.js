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

import shopify from "../shopify.js";

export const getCustomer = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });
    
    // ✅ CORRECT QUERY - Get CURRENT customer
    const response = await client.query({
      data: `query {
        customer(customerAccessToken: "${req.headers['x-customer-access-token'] || ''}") {
          id
          firstName
          lastName
          email
          phone
          displayName
        }
      }`
    });
    
    // Alternative: If you want to get customer by their own session
    // You need customer access token from frontend
    
    console.log("Current login user:", response.body.data.customer);
    
    if (response.body.data.customer) {
      res.json(response.body.data.customer);
    } else {
      res.status(401).json({ error: 'Customer not logged in' });
    }
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(401).json({ error: 'Customer not logged in or session expired' });
  }
}