import { Client, Databases, Account } from "appwrite";

const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("678c78a70025a41f7d95"); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);

// Database and collection IDs for your app data
export const USERS_DATABASE_ID = "67f6882400389383a21a";
export const VIDEO_ANALYTICS_COLLECTION_ID = "video-analytics";

// Email verification helper functions
export const sendVerificationEmail = async () => {
  try {
    // Make sure we're using the correct verification path that matches our route
    const url = window.location.origin + '/verify-email'; 
    const response = await account.createVerification(url);
    return response;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

// Check if a user's email is verified
export const isEmailVerified = async () => {
  try {
    const user = await account.get();
    return user.emailVerification;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
};

// Helper function to check if a user exists
export const checkUserExists = async (email) => {
  try {
    // Use try/catch and attempt to get a reset password token
    // This is a non-destructive way to check if an email exists
    await account.createRecovery(email, window.location.origin + '/reset-password');
    return true;
  } catch (error) {
    if (error.code === 404) {
      return false; // User doesn't exist
    }
    throw error; // Re-throw other errors
  }
};

// Helper function to clear all sessions if needed
export const clearAllSessions = async () => {
  try {
    // Get all sessions
    const sessions = await account.listSessions();
    
    // Delete each session
    for (const session of sessions.sessions) {
      await account.deleteSession(session.$id);
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing sessions:", error);
    return false;
  }
};