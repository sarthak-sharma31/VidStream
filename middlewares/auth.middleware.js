import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";


export const verifyJWT = async(req, res, next)=>{
    try {
        const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ", "");
    
        if(!token){
            return res.status(401).json({error: "Unauthorized Access"});
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id);
    
        if(!user) return res.status(401).json({error: "Invalid Token!"});
    
        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json({error: "Invalid AccessToken"});
    }
}