// src/appwrite.js
import { Client, Databases, Account } from "appwrite";

const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("678c78a70025a41f7d95"); // Replace with your actual project ID

export const account = new Account(client);
export const databases = new Databases(client);

// Database and collection IDs for your app data (adjust these as needed)
export const USERS_DATABASE_ID = "67f6882400389383a21a";
export const VIDEO_ANALYTICS_COLLECTION_ID = "video-analytics";