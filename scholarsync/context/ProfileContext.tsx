import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type StudentType = "college" | "school";

export interface UserProfile {
  name: string;
  studentType: StudentType;
  attendanceThreshold: number;
  onboardingComplete: boolean;
  tourComplete: boolean;
}

const defaultProfile: UserProfile = {
  name: "",
  studentType: "college",
  attendanceThreshold: 75,
  onboardingComplete: false,
  tourComplete: false,
};

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    import("../services/db").then(({ loadUserDoc }) => {
      loadUserDoc(user.uid).then((doc) => {
        if (doc?.profile) setProfile(doc.profile as unknown as UserProfile);
        setIsLoaded(true);
      });
    });
  }, [user]);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...updates };
        if (user) {
          import("../services/db").then((db) => db.saveUserProfile(user.uid, next));
        }
        return next;
      });
    },
    [user]
  );

  const value = useMemo(() => ({
    profile,
    updateProfile,
    isLoaded,
  }), [profile, updateProfile, isLoaded]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
