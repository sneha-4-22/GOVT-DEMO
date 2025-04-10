import { ID } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account, sendVerificationEmail, isEmailVerified, checkUserExists } from "../appwrite";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  async function login(email, password) {
    try {
      // First check if user is already logged in, if so, log them out
      try {
        const currentUser = await account.get();
        if (currentUser) {
          // User already has a session, let's delete it first
          await account.deleteSession("current");
        }
      } catch (sessionError) {
        // No current session, this is fine
        console.log("No existing session found");
      }

      // Now create a new session
      const session = await account.createEmailPasswordSession(email, password);
      const loggedInUser = await account.get();
      
      // Check if email is verified
      const emailVerified = loggedInUser.emailVerification;
      setIsVerified(emailVerified);
      setUser(loggedInUser);
      
      return { user: loggedInUser, isVerified: emailVerified };
    } catch (error) {
      console.error("Login error:", error);
      // Enhanced error handling
      if (error.code === 401) {
        throw new Error("Invalid email or password. Please try again.");
      }
      throw error;
    }
  }

  async function logout() {
    try {
      await account.deleteSession("current");
      setUser(null);
      setIsVerified(false);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsVerified(false);
    }
  }

  async function register(email, password, name) {
    try {
      // First, make sure no active session exists
      try {
        await account.deleteSession("current");
      } catch (logoutError) {
        // No session to delete, that's fine
      }

      // Create the user account
      const newUser = await account.create(ID.unique(), email, password, name);
      console.log("User created successfully:", newUser);
      
      // Login the user to get a valid session
      const loginResult = await login(email, password);
      
      // Send verification email with the authenticated session
      try {
        await sendVerificationEmail();
        console.log("Verification email sent successfully");
      } catch (verifyError) {
        console.error("Failed to send verification email:", verifyError);
        // Continue despite verification email failure
      }
      
      return loginResult;
    } catch (error) {
      console.error("Registration error:", error);
      // Enhanced error handling
      if (error.code === 409) {
        throw new Error("A user with this email already exists. Please try logging in instead.");
      }
      throw error;
    }
  }

  async function sendNewVerificationEmail() {
    try {
      // Make sure the user is logged in first
      if (!user) {
        throw new Error("You must be logged in to request a verification email.");
      }
      
      const response = await sendVerificationEmail();
      console.log("New verification email sent");
      return response;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  }

  async function checkVerificationStatus() {
    try {
      const verified = await isEmailVerified();
      setIsVerified(verified);
      return verified;
    } catch (error) {
      console.error("Error checking verification:", error);
      return false;
    }
  }

  async function init() {
    try {
      setLoading(true);
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      
      // Check verification status
      const verified = await isEmailVerified();
      setIsVerified(verified);
    } catch (error) {
      // User is not logged in - this is normal
      setUser(null);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <UserContext.Provider value={{
      current: user,
      loading,
      isVerified,
      login,
      logout,
      register,
      sendNewVerificationEmail,
      checkVerificationStatus
    }}>
      {children}
    </UserContext.Provider>
  );
}