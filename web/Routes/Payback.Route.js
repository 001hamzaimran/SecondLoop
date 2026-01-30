import { Router } from "express";
import { createPaybackForm } from "../Controller/PaybackForm.Controller.js";
import upload from "../Utils/multerConfig.js";

const PaybackRouter = Router();

// note the field name the frontend uses: "images[]"
PaybackRouter.post("/payback-form", upload.array("images[]", 8), createPaybackForm);

export default PaybackRouter;