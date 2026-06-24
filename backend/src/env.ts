import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: process.env.MONGODB_URI ?? "",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};

if (!env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
