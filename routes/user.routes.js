import { Router } from "express";
import { loginUser, registerUser, refreshAccessToken, resetPassword, updateAccountDetails, getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { v2 as cloudinary } from "cloudinary";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { User } from "../models/User.models.js";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const router = Router();

// router.post('/register', upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),(req, res)=>{registerUser});
router.post('/register', upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), registerUser);

router.post('/login', loginUser);

router.post('/refresh-token', refreshAccessToken);

router.get('/logout', verifyJWT, async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id,
            {
                $set:{refreshToken: undefined}
            },
            {
                new: true
            }
        )
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        return res.status(200).json({message: "Successfully logged out!"})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
});

router.post('/get-current-user', verifyJWT, getCurrentUser);

router.post('/update-account-details', verifyJWT, updateAccountDetails);

router.post('/reset-password', resetPassword);

export default router;