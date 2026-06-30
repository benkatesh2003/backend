import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ─── Publish a Video ───
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (
        [title, description].some(
            field => typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video file upload failed");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

// ─── Get All Videos ───
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        query,
        sortBy = "createdAt",
        sortType = "desc",
    } = req.query;

    const pipeline = [];

    // Only show published videos
    pipeline.push({ $match: { isPublished: true } });

    // Search filter
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            },
        });
    }

    // Sort
    pipeline.push({
        $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
    });

    // Populate owner
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            ],
        },
    });

    pipeline.push({
        $addFields: {
            owner: { $first: "$owner" },
        },
    });

    const aggregate = Video.aggregate(pipeline);

    const result = await Video.aggregatePaginate(aggregate, {
        page: parseInt(page),
        limit: parseInt(limit),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

// ─── Get Video By Id ───
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate(
        "owner",
        "username fullName avatar"
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Increment views
    video.views += 1;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

// ─── Delete Video ───
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// ─── Toggle Publish Status ───
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Publish status toggled successfully"));
});

export {
    publishVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
};
