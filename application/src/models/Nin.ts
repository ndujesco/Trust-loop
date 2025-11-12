import mongoose, { Schema, Document } from "mongoose";

export interface INin extends Document {
  nin: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender?: string;
  birthDate?: string;
  photo?: string;
  telephoneNo?: string;
    address?: string;
}

const NinSchema = new Schema<INin>(
  {
    nin: { type: String, required: true, index: true },
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

export const Nin = mongoose.models.Nin || mongoose.model<INin>("Nin", NinSchema);
