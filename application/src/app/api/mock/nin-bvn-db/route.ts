import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Nin } from "@/models/Nin";
import { Bvn } from "@/models/Bvn";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body || {};
    if (!type || !data) return NextResponse.json({ message: "type and data are required" }, { status: 422 });
    if (type !== "nin" && type !== "bvn") return NextResponse.json({ message: "type must be 'nin' or 'bvn'" }, { status: 422 });

    await connectDB();

    if (type === "nin") {
      if (!data.nin) return NextResponse.json({ message: "data.nin is required" }, { status: 422 });
      // upsert by nin
      const record = await Nin.findOneAndUpdate({ nin: data.nin }, data, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
      return NextResponse.json({ data: record }, { status: 201 });
    }

    // bvn
    if (!data.bvn) return NextResponse.json({ message: "data.bvn is required" }, { status: 422 });
    const record = await Bvn.findOneAndUpdate({ bvn: data.bvn }, data, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");
    // If neither type nor id provided -> return all records for both types
    await connectDB();

    if (!type && !id) {
      const [allNins, allBvns] = await Promise.all([Nin.find().lean(), Bvn.find().lean()]);
      return NextResponse.json({ nins: allNins, bvns: allBvns }, { status: 200 });
    }

    // If type provided but no id -> return all of that type
    if (type && !id) {
      if (type !== "nin" && type !== "bvn") return NextResponse.json({ message: "type must be 'nin' or 'bvn'" }, { status: 400 });
      if (type === "nin") {
        const allNins = await Nin.find().lean();
        return NextResponse.json({ data: allNins }, { status: 200 });
      }
      const allBvns = await Bvn.find().lean();
      return NextResponse.json({ data: allBvns }, { status: 200 });
    }

    // If id provided but no type -> search both collections
    if (!type && id) {
      const ninRecord = await Nin.findOne({ nin: id }).lean();
      if (ninRecord) return NextResponse.json({ data: ninRecord, type: "nin" }, { status: 200 });
      const bvnRecord = await Bvn.findOne({ bvn: id }).lean();
      if (bvnRecord) return NextResponse.json({ data: bvnRecord, type: "bvn" }, { status: 200 });
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Both type and id provided -> existing behavior
    if (type !== "nin" && type !== "bvn") return NextResponse.json({ message: "type must be 'nin' or 'bvn'" }, { status: 400 });
    if (type === "nin") {
      const record = await Nin.findOne({ nin: id }).lean();
      if (!record) return NextResponse.json({ message: "Not found" }, { status: 404 });
      return NextResponse.json({ data: record }, { status: 200 });
    }

    const record = await Bvn.findOne({ bvn: id }).lean();
    if (!record) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ data: record }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
