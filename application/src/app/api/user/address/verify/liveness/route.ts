import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId as string;

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 422 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    user.verificationStatus = 3;
    user.verificationId = `${Date.now().toString().slice(-8)}`
    await user.save();

    return NextResponse.json({ message: "Verification status updated to 3", user }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error", error: err.message }, { status: 500 });
  }
}
