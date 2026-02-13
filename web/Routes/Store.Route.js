import { Router } from "express";
import { getStores } from "../Controller/Store.Controller.js";

const StoreRouter = Router();

// note the field name the frontend uses: "images[]"
StoreRouter.get("/store-info", getStores);

export default StoreRouter;