import dotenv from "dotenv";
dotenv.config();


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});



const uploadOnCloudinary = async (localFilePath) => {
    if(!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);  // This is crucial!
        // Optional: Only delete the file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

// (async function(){
//     const result = await cloudinary.uploader.upload('../public/images/Screenshot.png');
//     console.log("Run it up", result.url);
// })();

export { uploadOnCloudinary };