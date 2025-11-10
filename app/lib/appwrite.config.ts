// appwrite.config.ts
import { Client, ID, Storage } from "appwrite";
import { Platform } from 'react-native';

// Appwrite Client Setup
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // endpoint
  .setProject("690dd5690033c230c41a"); //  project ID

// Appwrite Storage instance
const storage = new Storage(client);

// bucket ID
const bucketId = "690dd594002e50356069";

export const uploadFile = async (uri: string, fileName: string) => {
  try {
    if (Platform.OS === 'web') {
      // Web environment
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      
      return await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
    } else {
      // Native environment (iOS/Android)
      const fileBlob = {
        uri: uri,
        name: fileName,
        type: 'image/jpeg',
      };
      
      return await storage.createFile(
        bucketId,
        ID.unique(),
        fileBlob as any
      );
    }
  } catch (error) {
    console.error("Appwrite upload error:", error);
    throw error;
  }
};

//  Get public URL of uploaded file
export const getFileURL = (fileId: string): string => {
  return `https://fra.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${client.config.project}`;
};

export { storage };

