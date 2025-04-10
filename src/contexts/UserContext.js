// src/contexts/UserContext.js
import { ID } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "../appwrite";


const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async function register(email, password, name) {
    try {
      await account.create(ID.unique(), email, password, name);
      return await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async function init() {
    try {
      setLoading(true);
      const loggedInUser = await account.get();
      setUser(loggedInUser);
    } catch (error) {
      setUser(null);
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
      login,
      logout,
      register
    }}>
      {children}
    </UserContext.Provider>
  );
}