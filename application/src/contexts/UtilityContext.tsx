"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface UtilityLocation {
  lat: number;
  long: number;
}

interface UtilityContextType {
  location: UtilityLocation;
  setUtilLocation: (loc: UtilityLocation) => void;
}

const UtilityContext = createContext<UtilityContextType | undefined>(undefined);

export function UtilityLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UtilityLocation>(() => {
    // Load from localStorage on initial render
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("utilityLocation");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error(
          "Error loading utility location from localStorage:",
          error
        );
      }
    }
    return { lat: 0, long: 0 };
  });

  const setUtilLocation = useCallback((loc: UtilityLocation) => {
    setLocation(loc);
    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("utilityLocation", JSON.stringify(loc));
      } catch (error) {
        console.error("Error saving utility location to localStorage:", error);
      }
    }
  }, []);

  return (
    <UtilityContext.Provider value={{ location, setUtilLocation }}>
      {children}
    </UtilityContext.Provider>
  );
}

export function useUtilLocation() {
  const context = useContext(UtilityContext);
  if (context === undefined) {
    throw new Error(
      "useUtilLocation must be used within a UtilityLocationProvider"
    );
  }
  return context;
}
