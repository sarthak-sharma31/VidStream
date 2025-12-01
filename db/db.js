import mongoose from "mongoose";
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`DB connection Successful!! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Error in db connection: ", error);
    }
}

export default connectDB;