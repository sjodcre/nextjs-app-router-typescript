import { uploadImage } from "@/app/_services/arweave";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {

    // const {text} = await req.json();
    const data = await req.formData()
    const file: File | null = data.get('file') as unknown as File
    console.log(file)
    if (!file) {
        return NextResponse.json({success: false})
    }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
        const txId = await uploadImage(buffer, file.name)
        return NextResponse.json(`https://arweave.net/${txId}`, {status: 201});

    } catch (error) {
        return NextResponse.json (error, {status: 500});
    }
}

