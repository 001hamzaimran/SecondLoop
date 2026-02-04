import { Router } from "express";
import { getProducts ,getProductById} from "../Controller/Product.Controller.js";

const ProductRouter = Router();

// note the field name the frontend uses: "images[]"
ProductRouter.get("/products", getProducts);
ProductRouter.get("/getProductById/:id", getProductById);

export default ProductRouter;