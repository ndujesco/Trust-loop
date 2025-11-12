import mongoose, { Schema, Document } from "mongoose";

export interface IBvn extends Document {
  bvn: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender?: string;
  birthDate?: string;
  photo?: string;
  telephoneNo?: string;
address?: string;
}

const BvnSchema = new Schema<IBvn>(
  {
    bvn: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    gender: { type: String },
    birthDate: { type: String },
    photo: { type: String },
    telephoneNo: { type: String },
    address: { type: String },

  },
  { timestamps: true }
);

export const Bvn = mongoose.models.Bvn || mongoose.model<IBvn>("Bvn", BvnSchema);
