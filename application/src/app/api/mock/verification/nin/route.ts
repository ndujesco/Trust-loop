import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Nin } from "@/models/Nin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nin } = body;
    if (!nin) return NextResponse.json({ message: "nin is required" }, { status: 422 });

    await connectDB();

    const record = await Nin.findOne({ nin }).lean();
    if (!record) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ data: record }, { status: 200 });
  } catch (err: any) {
    console.error("NIN mock error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  // Simple health/status for the mock endpoint
  return NextResponse.json({ status: "ok", service: "mock-nin-verification" });
}
