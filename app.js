import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.routes.js"

const app = express();

// Set up CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Remove express.json() since we're using multer for file uploads
// app.use(express.json({ limit: "16kb" })); // Not needed for file uploads

// Ensure the body parser for form data is used
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware (if needed)
app.use(express.static("public"));
app.use(cookieParser());

// Register user routes
app.use("/api/v1/user", userRoutes);

export { app };