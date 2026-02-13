import { syncStore } from "../Controller/Store.Controller.js";

export const afterAuth = async (req, res, next) => {
  const session = res.locals.shopify.session;

  if (session) {
    await syncStore(session);
  }

  next();
};
