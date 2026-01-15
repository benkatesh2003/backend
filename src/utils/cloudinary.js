import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY , 
  api_secret:process.env.CLOUDINARY_SECRET 
});

const uploadOnCloudinary=async (localfilepath) => {
    try{
        if(!localfilepath) return "please upload tha file"
        //upload the file on cloudinary
        const response =await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        //file has uploaded as succesfully
        console.log("file is uploaded on clodinary",
            response.url);
            return response;
    }
    catch(error){
        fs.unlinkSync(localfilepath)//remove the locally saved temporary file as the upload
    }
}

export {uploadOnCloudinary}