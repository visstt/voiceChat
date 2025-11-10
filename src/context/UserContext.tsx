import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface UserContextType {
  userPhoto: string | null;
  setUserPhoto: (photo: string | null) => void;
  voiceSample: File | null;
  setVoiceSample: (voice: File | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [voiceSample, setVoiceSample] = useState<File | null>(null);

  return (
    <UserContext.Provider
      value={{
        userPhoto,
        setUserPhoto,
        voiceSample,
        setVoiceSample,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
