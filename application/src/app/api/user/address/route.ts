import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, address } = body || {};
    if (!userId) return NextResponse.json({ message: "userId is required" }, { status: 422 });
    if (!address || !address.raw) return NextResponse.json({ message: "address.raw is required" }, { status: 422 });

    await connectDB();

    // normalize a minimal address object
    const addr = {
      raw: String(address.raw),
      googlePlaceId: address.googlePlaceId ?? null,
      landmarks: address.landmarks ?? [],
      geolocation: address.geolocation ?? {},
      fromDocument: address.fromDocument ?? null,
      fromUtility: address.utilityBillFileIds ?? [],
      movedInAt: address.movedInAt ? new Date(address.movedInAt) : undefined,
      isCurrent: typeof address.isCurrent === "boolean" ? address.isCurrent : false,
      validatedAt: address.validatedAt ? new Date(address.validatedAt) : undefined,
      confidenceScore: address.confidenceScore ?? null,
    };

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { address: addr } },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
