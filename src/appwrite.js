import { Client, Databases, Account, Query } from "appwrite";

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

// Check and update monthly usage limits for YouTube Comment Analyzer
export const checkDailyLimit = async (userId) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    const currentYear = currentDate.getFullYear();
    const monthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`; // YYYY-MM format
    
    const response = await databases.listDocuments(
      USERS_DATABASE_ID,
      VIDEO_ANALYTICS_COLLECTION_ID,
      [
        Query.equal('user_id', userId),
        Query.equal('month_year', monthYear)
      ]
    );
    
    // Check the monthly limit (3 analyses per month)
    const MAX_MONTHLY_LIMIT = 3;
    let usedThisMonth = 0;
    
    if (response.documents.length > 0) {
      // Get the document with the highest count for this month
      const monthDoc = response.documents.reduce((prev, current) => {
        return (prev.monthly_analysis_count > current.monthly_analysis_count) 
          ? prev 
          : current;
      });
      
      usedThisMonth = monthDoc.monthly_analysis_count || 0;
    }
    
    const remaining = MAX_MONTHLY_LIMIT - usedThisMonth;
    
    return {
      allowed: remaining > 0,
      used: usedThisMonth,
      remaining: remaining,
      message: remaining <= 0 ? "You've reached your monthly limit of 3 video analyses" : ""
    };
  } catch (error) {
    console.error("Error checking monthly limit:", error);
    // If error occurs, allow the analysis but log the error
    return {
      allowed: true,
      used: 0,
      remaining: 3,
      message: "Unable to check usage limit"
    };
  }
};

// Update the analysis count after successful analysis
export const updateAnalysisCount = async (userId) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    const currentYear = currentDate.getFullYear();
    const monthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`; // YYYY-MM format
    const fullDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD for tracking last analysis
    
    const response = await databases.listDocuments(
      USERS_DATABASE_ID,
      VIDEO_ANALYTICS_COLLECTION_ID,
      [
        Query.equal('user_id', userId),
        Query.equal('month_year', monthYear)
      ]
    );
    
    let currentCount = 0;
    let documentId = null;
    
    if (response.documents.length > 0) {
      // Get the document with the highest count for this month
      const monthDoc = response.documents.reduce((prev, current) => {
        return (prev.monthly_analysis_count > current.monthly_analysis_count) 
          ? prev 
          : current;
      });
      
      currentCount = monthDoc.monthly_analysis_count || 0;
      documentId = monthDoc.$id;
    }
    
    if (documentId) {
      // Update existing document
      await databases.updateDocument(
        USERS_DATABASE_ID,
        VIDEO_ANALYTICS_COLLECTION_ID,
        documentId,
        {
          last_analysis_date: fullDate,
          month_year: monthYear,
          monthly_analysis_count: currentCount + 1
        }
      );
    } else {
      // Create a new tracking document if none exists for this month
      await databases.createDocument(
        USERS_DATABASE_ID,
        VIDEO_ANALYTICS_COLLECTION_ID,
        'unique()',
        {
          user_id: userId,
          last_analysis_date: fullDate,
          month_year: monthYear,
          monthly_analysis_count: 1,
          title: "Monthly Usage Tracking", // Adding a title for better identification in database
          content: "Monthly usage tracking record" // Optional descriptive content
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error("Error updating analysis count:", error);
    return false;
  }
};