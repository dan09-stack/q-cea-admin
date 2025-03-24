/**
 * Import function triggers from their respective submodules:
 */

import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Define the interface for the request data
interface DeleteUserRequest {
  email: string;
}

// Export the function using v2 syntax
export const deleteAuthUser = onCall<DeleteUserRequest>(async (request) => {
  try {
    const { data } = request;
    
    if (!data.email) {
      throw new Error("Email is required");
    }

    // Find the user by email
    const userRecord = await admin.auth().getUserByEmail(data.email);

    // Delete the user
    await admin.auth().deleteUser(userRecord.uid);

    return { success: true, message: "User deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    
    // Handle the unknown error type properly
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // In v2, you throw regular errors instead of HttpsError
    throw new Error(errorMessage);
  }
});
