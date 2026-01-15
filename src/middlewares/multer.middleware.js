import multer from "multer";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./")
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)// this is used to genarete the unique id to the file that has been upload
    // cb(null, file.fieldname + '-' + uniqueSuffix)
    //below we use original file but it is for the temporary  file
    cb(null,  file.originalname)
  }
})

 export const upload = multer({ 
    storage: storage 
})