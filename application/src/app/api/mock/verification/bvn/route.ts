import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Bvn } from "@/models/Bvn";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bvn } = body;
    if (!bvn) return NextResponse.json({ message: "bvn is required" }, { status: 422 });

    await connectDB();

    const record = await Bvn.findOne({ bvn }).lean();
    if (!record) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ data: record }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mock-bvn-verification" });
}
