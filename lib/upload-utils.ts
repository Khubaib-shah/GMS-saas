/**
 * uploadToCloudinary
 * 
 * Utility to upload a File object to Cloudinary via our internal API.
 */
export async function uploadToCloudinary(file: File, folder: string = "general") {
    const isVideo = file.type.startsWith("video/");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("resourceType", isVideo ? "video" : "auto");

    const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
    }

    return {
        url: data.url,
        publicId: data.publicId,
        resourceType: data.resourceType
    };
}
