import { uploadImage } from "@/app/_services/arweave";
import logger from "@/app/_utils/logger";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    logger.info("Uploading image at deploy.")
    // const {text} = await req.json();
    const data = await req.formData()
    const file: File | null = data.get('file') as unknown as File
    // logger.info('file data', {file})
    // console.log(file)
    if (!file) {
        return NextResponse.json({success: false})
    }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
        const txId = await uploadImage(buffer, file.name)
        return NextResponse.json(`https://arweave.net/${txId}`, {status: 201});

    } catch (error) {
        logger.error('Error uploading image when deploy:', {error});
        return NextResponse.json (error, {status: 500});
    }
}

