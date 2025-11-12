import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import {User} from "@/models/User";
import { extractPublicId } from "cloudinary-build-url";

function isValidUrl(u?: string) {
  if (!u || typeof u !== "string") return false;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let {
      billUrl,
      userId,
      formattedAddress,
      googlePlaceId,
 
    } = body;

    const {
      confidenceScore,
      lat,
      lng,
    } = body

    // Basic presence + type normalization
    userId = typeof userId === "string" ? userId.trim() : userId;
    billUrl = typeof billUrl === "string" ? billUrl.trim() : billUrl;
    formattedAddress = typeof formattedAddress === "string" ? formattedAddress.trim() : formattedAddress;
    googlePlaceId = typeof googlePlaceId === "string" ? googlePlaceId.trim() : googlePlaceId;

    // ---------- Quick validations ----------
    // userId looks like an ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid or missing userId" }, { status: 422 });
    }

    // billUrl must be a valid http(s) url
    if (!billUrl || !isValidUrl(billUrl)) {
      return NextResponse.json({ message: "Invalid or missing billUrl" }, { status: 422 });
    }

 

    //_lat & _lng => numbers and in range
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
      return NextResponse.json({ message: "Invalid latitude or longitude" }, { status: 422 });
    }
    if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
      return NextResponse.json({ message: "Latitude or longitude out of range" }, { status: 422 });
    }

    // confidenceScore => try to normalize to 0..1
    let cs: number | null = null;
    if (confidenceScore !== undefined && confidenceScore !== null && confidenceScore !== "") {
      cs = Number(confidenceScore);
      if (!Number.isFinite(cs)) {
        return NextResponse.json({ message: "Invalid confidenceScore" }, { status: 422 });
      }
      // Accept 0..1 or 0..100, normalize if needed
      if (cs > 1 && cs <= 100) cs = cs / 100;
      if (cs < 0 || cs > 1) {
        return NextResponse.json({ message: "confidenceScore must be between 0 and 1" }, { status: 422 });
      }
    }

    // formattedAddress presence + length cap
    if (!formattedAddress || formattedAddress.length < 3) {
      return NextResponse.json({ message: "Invalid or missing formattedAddress" }, { status: 422 });
    }
    if (formattedAddress.length > 2000) {
      formattedAddress = formattedAddress.slice(0, 2000);
    }



    // ---------- DB operations ----------
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update DB using the S3 URL directly (no Cloudinary upload)
    user.address ||= {};
    user.address.fromUtility = formattedAddress;
    user.address.raw = formattedAddress;
    user.address.googlePlaceId = googlePlaceId || null;
    user.address.geolocation = { lat: nLat, lng: nLng };
    user.address.confidenceScore = cs ?? null;
    user.address.isCurrent = true;

    if (user.verificationStatus < 2) user.verificationStatus = 2;

    user.documents.push({
      type: "utility_bill",
      fileId: typeof extractPublicId === "function" ? extractPublicId(billUrl) : null,
      bloburl: billUrl,
      uploadedAt: new Date(),
    });


    await user.save();

    return NextResponse.json({ message: "Proof of address saved", user }, { status: 200 });
  } catch (err: any) {
    console.error("Error saving proof of address:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
