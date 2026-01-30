// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: "dh3jgql1i",
  api_key: "363444943861182",
  api_secret: "MhZlKjZPYCPoEqtTgAv300y_orQ",
  secure: true,
});

export default cloudinary;
