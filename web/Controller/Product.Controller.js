import shopify from "../shopify.js";

export const getProducts = async (req, res) => {
    try {
        console.log("Fetching products for shop:", req.query.shop);
        const generatedsession = await shopify.config.sessionStorage.findSessionsByShop(req.query.shop)
        console.log("res.locals.shopify:", generatedsession);
        const session = generatedsession[0];
        console.log("Session found:", session);

        const client = new shopify.api.clients.Graphql({ session });

        const { body } = await client.query({
            data: `query {
  products(first: 10) {
    nodes {
      id
      title
      handle
      vendor
      images(first: 5) {
        nodes {
          id
          url
          altText
        }
      }
    }
  }
}`,
        });

        return res.json(body.data.products.nodes);

    } catch (error) {
        console.log("GraphQL Error:", error);
        return res.status(500).json({ error: "failed to fetch products" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const session = res.locals.shopify?.session;
        if (!session) {
            return res.status(401).json({ error: "No Session Found" });
        }

        const client = new shopify.api.clients.Graphql({ session });
        const { id } = req.params;
        console.log("Fetching product ID:", id);

        const { body } = await client.query({
            data: {
                query: `query ProductMetafields($ownerId: ID!) {
                    product(id: $ownerId) {
                        id
                        title
                        handle
                        vendor
                        metafields(first: 3) {
                            edges {
                                node {
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                    }
                }`,
                variables: { ownerId: `gid://shopify/Product/${id}` }
            },
        });

        console.log("GraphQL response:", body);

        return res.json(body?.data?.product || []);

    } catch (error) {
        console.log(error, "<<< error")
        return res.status(500).json({ error: "failed to fetch product metafields" });
    }
}