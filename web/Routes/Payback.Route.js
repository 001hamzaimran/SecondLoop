import { Router } from "express";
import { createPaybackForm, getDataPaybackForm ,updateStatusPaybackForm } from "../Controller/PaybackForm.Controller.js";
import upload from "../Utils/multerConfig.js";
import {createGiftCardForCustomer} from "../Controller/GiftCard.Controller.js"
import {getCustomer} from "../Controller/GetCustomer.Controller.js"

const PaybackRouter = Router();

// note the field name the frontend uses: "images[]"
PaybackRouter.post("/payback-form", upload.array("images", 8), createPaybackForm);
PaybackRouter.get("/get-tradein-request", getDataPaybackForm);
PaybackRouter.put("/update-tradein-request-status", updateStatusPaybackForm);
PaybackRouter.post("/create-giftcard", createGiftCardForCustomer);
PaybackRouter.get("/get-customer", getCustomer);

export default PaybackRouter;