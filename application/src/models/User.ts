import mongoose, { Schema, Document, Model } from "mongoose";

interface Phone {
  number: string;
  type: "primary" | "secondary";
  simRegistrationAgeMonths?: number;
  lastValidatedAt?: Date;
}

interface Landmark {
  lat: number;
  lng: number;
}

interface Address {
  raw?: string;
  fromNin?: string | null;
  fromBvn?: string | null;
  fromUtility?: string;
  googlePlaceId?: string | null;
  landmarks?: Landmark[];
  geolocation?: { lat?: number; lng?: number };
  movedInAt?: Date;
  isCurrent: boolean;
  confidenceScore?: number | null;
}

// TODO: Add file url
interface DocumentFile {
  type: "passport" | "national_id" | "drivers_license" | "utility_bill" | "other";
  fileId: string;
  bloburl?: string;
  extracted?: {
    fullName?: string;
    dob?: string;
    idNumber?: string;
    address?: string;
  };
  forgeryScore?: number;
  uploadedAt: Date;
  checkedAt?: Date;
}

interface VerificationRecord {
  tier: 1 | 2 | 3;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  dataSnapshot?: any;
}

interface Referee {
  name: string;
  phone: string;
  relationship?: string;
  consentGivenAt?: Date;
  credibilityScore?: number;
}

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  verificationId?: string;
  fullNameIndexed?: string;
  dob?: Date;
  placeOfBirth?: string;

  bvn: string;
  bvnImage: string;
  nin: string;
  ninImage: string;
  liveUrls?: string[];

  phones: Phone[];
  address: Address;
  documents: DocumentFile[];
  verificationRecords: VerificationRecord[];
  referees: Referee[];
  trustScore: number;
  flags: string[];
  verificationStatus: 0 | 1 | 2 | 3 | 4;
}

const LandmarkSchema = new Schema<Landmark>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const AddressSchema = new Schema<Address>(
  {
    raw: { type: String, required: false },
  fromNin: { type: String, default: null },
  fromBvn: { type: String, default: null },
  fromUtility: { type: String, default: "" },
    googlePlaceId: { type: String, default: null },
    landmarks: { type: [LandmarkSchema], default: [] }, // ✅ array of coordinates
    geolocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    movedInAt: { type: Date },
    isCurrent: { type: Boolean, required: true },

    confidenceScore: { type: Number, default: null },
  },
  { _id: false }
);

// Sub-schemas for arrays
const PhoneSchema = new Schema<Phone>(
  {
    number: { type: String, required: true },
    type: { type: String, enum: ["primary", "secondary"], required: true },
    simRegistrationAgeMonths: { type: Number },
    lastValidatedAt: { type: Date },
  },
  { _id: false }
);

const DocumentFileSchema = new Schema<DocumentFile>(
  {
    type: { type: String, enum: ["passport", "national_id", "drivers_license", "utility_bill", "other"], required: true },
    fileId: { type: String, required: true },
    bloburl: { type: String },
    extracted: { type: Schema.Types.Mixed },
    forgeryScore: { type: Number },
    uploadedAt: { type: Date, required: true },
    checkedAt: { type: Date },
  },
  { _id: false }
);

const VerificationRecordSchema = new Schema<VerificationRecord>(
  {
    tier: { type: Number, enum: [1, 2, 3], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], required: true },
    reason: { type: String },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    dataSnapshot: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const RefereeSchema = new Schema<Referee>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String },
    consentGivenAt: { type: Date },
    credibilityScore: { type: Number },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    verificationId: { type: String, required: false, trim: true },
    fullNameIndexed: { type: String, index: true },
    dob: Date,
    placeOfBirth: String,

    bvn: {
        type: String, required: true
      },
  nin: {type: String, required: true},
  ninImage: { type: String, required: true },
  bvnImage: { type: String, required: true },
  liveUrls: { type: [String], default: [] },

    phones: { type: [PhoneSchema], default: [] },
    address: { type: AddressSchema, default: null },
    documents: { type: [DocumentFileSchema], default: [] },
    verificationRecords: { type: [VerificationRecordSchema], default: [] },
    referees: { type: [RefereeSchema], default: [] },
    trustScore: { type: Number, default: 0 },
    flags: { type: [String], default: [] },
        verificationStatus: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
