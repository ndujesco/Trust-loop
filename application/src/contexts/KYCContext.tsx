"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Types for KYC data

export interface IDInformation {
  bvn?: string;
  nin?: string;
}

export interface VerificationStatus {
  bvnExists: boolean | null;
  faceVerification: "pending" | "processing" | "completed" | "failed";
  addressVerification: "pending" | "processing" | "completed" | "failed";
  overallStatus: "incomplete" | "processing" | "completed" | "failed";
}

export interface AddressPartners {
  selected: string[];
  verified: string[];
}

export interface UserAddress {
  fromNin: string;
  fromBvn: string;
  fromUtility: string | null;
  raw: string | null;
  googlePlaceId: string | null;
  landmarks: string[];
  movedInAt: string | null;
  isCurrent: boolean;
  confidenceScore: number | null;
}

export interface UserPhone {
  number: string;
  type: string;
}

export interface UserData {
  firstName: string;
  middleName: string;
  lastName: string;
  verificationId: string;
  bvn: string;
  nin: string;
  ninImage: string;
  bvnImage: string;
  liveUrls: string[];
  phones: UserPhone[];
  address: UserAddress;
  trustScore: number;
  flags: string[];
  verificationStatus: number;
  _id: string;
  documents: any[];
  verificationRecords: any[];
  referees: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CurrentAddress {
  state: string;
  lga: string;
  area: string;
  address: string;
}

export interface CapturedImage {
  dataUrl: string;
  timestamp: Date;
}

export interface PersonalDetails {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  residentialAddress: string;
  state: string;
  lga: string;
}

export interface KYCState {
  // Step tracking
  currentStep: number;
  completedSteps: number[];

  // Form data
  idInformation: IDInformation | null;
  addressPartners: AddressPartners;
  currentAddress: CurrentAddress | null;
  userData: UserData | null;
  personalDetails: Partial<PersonalDetails>;
  capturedImage: CapturedImage | null;

  // Verification status
  verificationStatus: VerificationStatus;

  // UI state
  isLoading: boolean;
  error: string | null;
}

// Action types
type KYCAction =
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_COMPLETED_STEPS"; payload: number[] }
  | { type: "SET_ID_INFORMATION"; payload: IDInformation }
  | { type: "SET_USER_DATA"; payload: UserData }
  | { type: "SET_VERIFICATION_STATUS"; payload: Partial<VerificationStatus> }
  | { type: "SET_PERSONAL_DETAILS"; payload: Partial<PersonalDetails> }
  | { type: "UPDATE_PERSONAL_DETAILS"; payload: Partial<PersonalDetails> }
  | { type: "SET_CAPTURED_IMAGE"; payload: CapturedImage }
  | { type: "SET_ADDRESS_PARTNERS"; payload: AddressPartners }
  | { type: "SET_CURRENT_ADDRESS"; payload: CurrentAddress }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_KYC" };

// Initial state
const initialState: KYCState = {
  currentStep: 0,
  completedSteps: [],
  idInformation: null,
  personalDetails: {},
  capturedImage: null,
  addressPartners: {
    selected: [],
    verified: [],
  },
  currentAddress: null,
  userData: null,
  verificationStatus: {
    bvnExists: null,
    faceVerification: "pending",
    addressVerification: "pending",
    overallStatus: "incomplete",
  },
  isLoading: false,
  error: null,
};

// Reducer function
function kycReducer(state: KYCState, action: KYCAction): KYCState {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };

    case "SET_COMPLETED_STEPS":
      return {
        ...state,
        completedSteps: action.payload,
      };

    case "SET_ID_INFORMATION":
      return {
        ...state,
        idInformation: action.payload,
        completedSteps: [...state.completedSteps, 1],
      };

    case "SET_ADDRESS_PARTNERS":
      return {
        ...state,
        addressPartners: action.payload,
      };

    case "SET_PERSONAL_DETAILS":
      return {
        ...state,
        personalDetails: action.payload,
      };

    case "UPDATE_PERSONAL_DETAILS":
      return {
        ...state,
        personalDetails: {
          ...state.personalDetails,
          ...action.payload,
        },
      };

    case "SET_CAPTURED_IMAGE":
      return {
        ...state,
        capturedImage: action.payload,
      };

    case "SET_USER_DATA":
      return {
        ...state,
        userData: action.payload,
      };

    case "SET_CURRENT_ADDRESS":
      return {
        ...state,
        currentAddress: action.payload,
      };

    case "SET_VERIFICATION_STATUS":
      return {
        ...state,
        verificationStatus: {
          ...state.verificationStatus,
          ...action.payload,
        },
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "RESET_KYC":
      return initialState;

    default:
      return state;
  }
}

// Context
const KYCContext = createContext<{
  state: KYCState;
  dispatch: React.Dispatch<KYCAction>;
} | null>(null);

// Provider component
export function KYCProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kycReducer, initialState);

  return (
    <KYCContext.Provider value={{ state, dispatch }}>
      {children}
    </KYCContext.Provider>
  );
}

// Hook to use KYC context
export function useKYC() {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error("useKYC must be used within a KYCProvider");
  }
  return context;
}

// Helper hooks for specific actions
export function useKYCActions() {
  const { dispatch } = useKYC();

  return {
    setCurrentStep: (step: number) =>
      dispatch({ type: "SET_CURRENT_STEP", payload: step }),

    setCompletedSteps: (steps: number[]) =>
      dispatch({ type: "SET_COMPLETED_STEPS", payload: steps }),

    setIdInformation: (info: IDInformation) =>
      dispatch({ type: "SET_ID_INFORMATION", payload: info }),

    setPersonalDetails: (details: Partial<PersonalDetails>) =>
      dispatch({ type: "SET_PERSONAL_DETAILS", payload: details }),

    updatePersonalDetails: (details: Partial<PersonalDetails>) =>
      dispatch({ type: "UPDATE_PERSONAL_DETAILS", payload: details }),

    setCapturedImage: (image: CapturedImage) =>
      dispatch({ type: "SET_CAPTURED_IMAGE", payload: image }),

    setAddressPartners: (partners: AddressPartners) =>
      dispatch({ type: "SET_ADDRESS_PARTNERS", payload: partners }),

    setUserData: (userData: UserData) =>
      dispatch({ type: "SET_USER_DATA", payload: userData }),

    setCurrentAddress: (address: CurrentAddress) =>
      dispatch({ type: "SET_CURRENT_ADDRESS", payload: address }),

    setVerificationStatus: (status: Partial<VerificationStatus>) =>
      dispatch({ type: "SET_VERIFICATION_STATUS", payload: status }),

    setLoading: (loading: boolean) =>
      dispatch({ type: "SET_LOADING", payload: loading }),

    setError: (error: string | null) =>
      dispatch({ type: "SET_ERROR", payload: error }),

    resetKYC: () => {
      dispatch({ type: "RESET_KYC" });
    },
  };
}
