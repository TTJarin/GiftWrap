// appwrite.config.ts
import { Client, ID, Storage } from "appwrite";

// ✅ Appwrite Client Setup
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Replace with your endpoint
  .setProject("690dd5690033c230c41a"); // Replace with your project ID

// ✅ Appwrite Storage instance
const storage = new Storage(client);

// ✅ Your bucket ID
const bucketId = "690dd594002e50356069";

// ✅ Upload File (Expo compatible)
export const uploadFile = async (uri: string, fileName: string) => {
  try {
    // Fetch the image and convert to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a File object for Appwrite upload
    const file = new File([blob], fileName, {
      type: blob.type || "image/jpeg",
    });

    // Upload file to Appwrite
    const uploaded = await storage.createFile(
      bucketId, // Bucket ID
      ID.unique(), // Unique file ID
      file
    );

    return uploaded; // Returns { $id, name, mimeType, ... }
  } catch (error) {
    console.error("Appwrite upload error:", error);
    throw error;
  }
};

// ✅ Get public URL of uploaded file
export const getFileURL = (fileId: string): string => {
  return `https://fra.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${client.config.project}`;
};

export { storage };