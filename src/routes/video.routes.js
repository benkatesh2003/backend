import { Router } from "express";
import {
    publishVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ─── Public routes ───
router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);

// ─── Protected routes (require login) ───
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishVideo
);

router.route("/:videoId").delete(verifyJWT, deleteVideo);
router.route("/toggle/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;
