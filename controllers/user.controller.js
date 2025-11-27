import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import path from "path"

const registerUser = async (req, res) => {

    const { fullName, email, password, username } = req.body;

    try {
        if (!(fullName || email || password || username)) {
            return res.status(400).json({ message: "All Feilds are Required!" });
        }
        const existedUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existedUser) {
            return res.status(400).json({ message: "User already exists!" });
        }

        const localAvatarpath = req.files?.avatar[0]?.path;
        const localCoverPath = req.files?.coverImage[0]?.path;


        if (!localAvatarpath) return res.status(400).json({ message: "Avatar is Required!" });

        const avatar = await uploadOnCloudinary(localAvatarpath);
        console.log("Avatar upload result:", avatar.url);

        if (localCoverPath) {
            const coverImage = await uploadOnCloudinary(localCoverPath);
            console.log("cover upload result:", coverImage.url);
            if (!coverImage) return res.status(400).json({ message: "Cover Image Upload failed!" });
        }

        let coverImageUrl = "";
        if (localCoverPath) {
            const coverImage = await uploadOnCloudinary(localCoverPath);
            coverImageUrl = coverImage.url;
            console.log("Cover upload result:", coverImageUrl);
        }

        if (!avatar) return res.status(400).json({ message: "Avatar Upload failed!" });

        const user = await User.create({
            fullName,
            email,
            password,
            username: username.toLowerCase(),
            avatar: avatar.url,
            coverImage: coverImageUrl
        });

        // Checking from the database for the user by _id
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) return res.status(500).json({ message: "User Registeration failed!" });
        //-----

        return res.status(200).json({ message: "User Registered Successfully" })
    }
    catch (error) {
        return res.status(300).json({ error: error })
    }
}

const loginUser = async (req, res)=>{
    const {email, username, password} = req.body;
}

export { registerUser };