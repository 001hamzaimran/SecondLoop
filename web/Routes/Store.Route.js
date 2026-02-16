import { Router } from "express";
import { getStores } from "../Controller/Store.Controller.js";
import { getSetting, updateColor, createSetting } from "../Controller/Settings.Controller.js";

const StoreRouter = Router();

// note the field name the frontend uses: "images[]"
StoreRouter.get("/store-info", getStores);
StoreRouter.post("/setting-color", createSetting);
StoreRouter.get("/setting-color", getSetting);
StoreRouter.put("/setting-color", updateColor);

export default StoreRouter;