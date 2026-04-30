import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || "5000",
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",

  // Optional. User can also send Groq key from mobile request body.
  groqApiKey: process.env.GROQ_API_KEY || "",

  smtpHost: process.env.SMTP_HOST || "",
smtpPort: process.env.SMTP_PORT || "587",
smtpSecure: process.env.SMTP_SECURE === "true",
smtpUser: process.env.SMTP_USER || "",
smtpPass: process.env.SMTP_PASS || "",
smtpFrom: process.env.SMTP_FROM || "",
};

if (!env.mongoUri) {
  throw new Error("MONGO_URI is missing");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is missing");
}