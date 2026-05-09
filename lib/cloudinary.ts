import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary with folder organization.
 * @param file - Base64 string or file path
 * @param folder - Destination folder (e.g., "gym-sms/exercises/svgs")
 * @param resourceType - "image", "video", or "auto"
 */
export const uploadToCloudinary = async (
  file: string,
  folder: string,
  resourceType: "image" | "video" | "auto" = "image"
) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `gym-sms/${folder}`,
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default cloudinary;
