/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "neighbor" | "business" | "admin" | "master-admin";
  photoURL?: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Debug info
    console.log("Firebase Active Project:", auth.app.options.projectId);
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
