import { error, log } from 'console';
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

const router = express.Router();

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save();
        // await user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const registerUser = async (req, res) => {

    const { fullName, email, password, username } = req.body;

    try {
        if (!fullName || !email || !password || !username) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }

        const localAvatarpath = req.files?.avatar?.[0]?.path;
        const localCoverPath = req.files?.coverImage?.[0]?.path;

        if (!localAvatarpath) return res.status(400).json({ message: "Avatar is Required!" });

        const avatar = await uploadOnCloudinary(localAvatarpath);
        console.log("Avatar upload result:", avatar.url);

        // if (localCoverPath) {
        //     const coverImage = await uploadOnCloudinary(localCoverPath);
        //     console.log("cover upload result:", coverImage.url);
        //     if (!coverImage) return res.status(400).json({ message: "Cover Image Upload failed!" });
        // }

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
        return res.status(500).json({ error: error.message })
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!(email || username)) {
            return res.status(400).json({ error: "Email or username is required!" });
        }

        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });

        if (!existingUser) {
            return res.status(300).json({ message: "User does not exists!" });
        }

        // const validPassword = await existingUser.isPasswordCorrect(password);
        const validPassword = await bcrypt.compare(password, existingUser.password);

        if (!validPassword) {
            return res.status(400).json({ message: "Invalid Password!" });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id);

        const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json({ user: loggedInUser, accessToken, refreshToken, message: "User logged in successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const refreshAccessToken = async (req, res)=>{
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;

        if(!token){
            return res.status(400).json({message: "Token is required!"});
        }

        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        if(!user){
            return res.status(400).json({error: "Invalid token"})
        }
        
        if(token != user.refreshToken){
            return res.status(400).json({error: "Token Expired!"})
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

        return res.status(200).cookie("accessToken", accessToken).cookie("refreshToken", refreshToken).json({accessToken, refreshToken, message: "Token refreshed!"})

    } catch (error) {
        return res.status(500).json({error: error.message});
    }
};

const resetPassword = async(req, res)=>{
    try {
        const {email, username, oldPassword, newPassword} = req.body;

        if (!(email || username)) {
            return res.status(400).json({ error: "Email or username is required!" });
        }

        if (!oldPassword && !newPassword) {
            return res.status(400).json({ error: "Old and New Password is required" });
        }

        const user = await(User.findOne({$or: [{email}, {username}]}));

        if(!user){
            return res.status(300).json({message: "User does not exist!"})
        }

        const validPass = user.isCorrectPassword(oldPassword);

        if(!validPass){
            return res.status(300).json({message: "Incorrect Password!"});
        }

        user.password = newPassword;

        await user.save();

        return res.status(200).json({message: "Password changed successfully!!"})

    } catch (error) {
        return res.status(500).json({error: error.message})
    }
};

const getCurrentUser = async(req, res)=>{
    try {
        const user = req.user;
        if(!user) return res.status(400).json({message: "User not found!"});
        return res.status(200).json({message: "Here is the user!", user});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
};

const updateAccountDetails = async(req, res)=>{
    try {
        let {username, fullName} = req.body;
        const user = req.user;
        if(!username){
            username = user.username;
        }
        if(!fullName){
            fullName = user.fullName;
        }
    
        const updatedUser = await User.findById(user._id);
    
        updatedUser.username = username.toLowerCase();
        updatedUser.fullName = fullName;
    
        await updatedUser.save();
        return res.status(200).json({message: "Account Updated Successfully!"});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
};

const updateUserAvatar = async(req, res)=>{
    try {
        const avtarLocalPath = req.files?.avatar?.[0]?.path;
    
        if(!avtarLocalPath) return res.status(400).json({message: "Avatar not found!"});
    
        const avatar = await uploadOnCloudinary(avtarLocalPath);
    
        if(!avatar.url) return res.status(500).json({error: "Error uploading on Cloudinary"});
        console.log(avatar.url);
    
        const user = User.findByIdAndUpdate(req.user._id, {
            $set:{
                avatar: avatar.url
            }
        }, {new: true}).select("-password")
    
        return res.status(200).json({message: "Avatar Upload Successfull"});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }

};
const updateUserCoverImage = async(req, res)=>{
    try {
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
        if(!coverImageLocalPath) return res.status(400).json({message: "Avatar not found!"});
    
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
        if(!coverImage.url) return res.status(500).json({error: "Error uploading on Cloudinary"});
        console.log(coverImage.url);
    
        const user = User.findByIdAndUpdate(req.user._id,
            {
                $set:{
                    coverImage: coverImage.url
                }
            }, {new:true}).select("-password");
    
        return res.status(200).json({message: "Cover Image Upload Successfull"});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }

};

const getUserChannelProfile = async(req, res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        return res.status(400).json({message: "Username is missing!"});
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:'_id',
                foreignField:'subscriber',
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:'subscribers'
                },
                channelSubscribedToCount:{
                    $size:'subscribedTo'
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, $subscribers.subscriber]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ]);
    
    console.log(channel);

    if(!channel?.length){
        return res.status(404).json({message: "Channel does not exist!"});
    }

    // return res.status(200).json({message: "Channel fetched successfully!", channel[0]});
    return res.status(200).json({message: "Channel fetched successfully!", channel});
};

const getWatchHistory = async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "Video",
                localField: "WatchHistory",
                foreignField: "_id",
                as: "WatchHistory",
                $pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            $pipeline:[
                                {$project:{
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }}
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200).json({message: "Watch History fetched successfully", user: user[0].watchHistory})
};

export { 
    registerUser,
    loginUser,
    refreshAccessToken,
    resetPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};