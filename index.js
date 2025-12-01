import dotenv from 'dotenv'
dotenv.config();
// dotenv.config({path: "./.env"});

import connectDB from "./db/db.js";
import { app } from './app.js';


const port = process.env.PORT || 3000;

connectDB().then(
    app.listen(port, ()=>{
        console.log(`Running on port ${port} http://localhost:3000/`);
    })
).catch((err)=>{
    console.log("DB connection errrrr!!", err);
});