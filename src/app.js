import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"



const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))// for json file that comes to the frontend 
app.use(express.urlencoded({extended:true,limit:"16kb"}))// it encoded the url into the structure format so that server understand
app.use(express.static("public"))//Anything inside the public folder can be shown directly to the user.”
app.use(cookieParser())//If browser sends a cookie… please read it and put it inside req.cookies.

//routes import

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'

//routes declaration

app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)

// ─── Global error handler ───
import { ApiError } from "./utils/ApiError.js";

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: false,
            errors: err.errors,
        });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({
        statusCode: 500,
        message: "Internal Server Error",
        success: false,
    });
});







export { app }