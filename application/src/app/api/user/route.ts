import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Nin } from "@/models/Nin";
import { Bvn } from "@/models/Bvn";
import { z } from "zod";

// Expect NIN, BVN, and address as a string
const createUserSchema = z.object({
  nin: z.string().min(8).max(11),
  bvn: z.string().length(11),
  address: z.string().min(1).optional()
});

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation error";
      return NextResponse.json({ message }, { status: 422 });
    }

    const { nin, bvn, address } = parsed.data;

    // Fetch NIN & BVN records
    const ninRecord = await Nin.findOne({ nin });
    const bvnRecord = await Bvn.findOne({ bvn });

    if (!ninRecord || !bvnRecord) {
      return NextResponse.json({ message: "NIN or BVN record not found" }, { status: 404 });
    }

    if (ninRecord.firstName.toLowerCase() !== bvnRecord.firstName.toLowerCase() ) {
      return NextResponse.json({ message: "NIN and BVN do not match" }, { status: 401 });
    }

        // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ nin }, { bvn }] });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists", user: existingUser }, { status: 200 });
    }
    
    const userAddress = {
      raw: address,
      fromNin: ninRecord.address || null,
      fromBvn: bvnRecord.address || null,
      fromUtility: null,
      googlePlaceId: null,
      landmarks: [],
      geolocation: {},
      movedInAt: null,
      isCurrent: true,
      confidenceScore: null
    };

    // Include phone if NIN has one
    const phones = ninRecord.telephoneNo ? [{ number: ninRecord.telephoneNo, type: "primary" }] : [];

    // Create user
    const user = await User.create({
      firstName: ninRecord.firstName,
      middleName: ninRecord.middleName,
      lastName: ninRecord.lastName || bvnRecord.lastName,
      bvn,
      nin,
      ninImage: ninRecord.photo,
      bvnImage: bvnRecord.photo,
      address: userAddress,
      phones,
      verificationStatus: 0
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error", error: err.message }, { status: 500 });
  }
}
