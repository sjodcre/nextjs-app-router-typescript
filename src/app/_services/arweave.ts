import Arweave from 'arweave';
import dotenv from 'dotenv';
import Transaction from 'arweave/node/lib/transaction';
import crypto from "crypto"
import * as Sentry from '@sentry/nextjs';

// import logger from '../_utils/logger';


// Load environment variables
dotenv.config();

class Tags {
    _tags = new Map();

    constructor() {
        this._tags = new Map();
    }
    get tags() {
        return Array.from(this._tags.entries()).map(([name, value]) => ({ name, value }));
    }
    addTag(key: any, value: any) {
        this._tags.set(key, value);
    }
    addTags(tags: any) {
        tags.forEach(({ name, value }: any) => this.addTag(name, value));
    }
    addTagsToTransaction(tx: Transaction) {
        this.tags.forEach(({ name, value }) => tx.addTag(name, value));
    }
}

// Initialize Arweave
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

// Content type detection function
export const contentTypeOf = (name: string): string => {
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".gif")) return "image/gif"
    if (name.endsWith(".svg")) return "image/svg+xml"
    if (name.endsWith(".webp")) return "image/webp"
    if (name.endsWith(".bmp")) return "image/bmp"
    if (name.endsWith(".ico")) return "image/vnd.microsoft.icon"
    if (name.endsWith(".tiff")) return "image/tiff"
    if (name.endsWith(".tif")) return "image/tiff"
    if (name.endsWith(".avif")) return "image/avif"
    if (name.endsWith(".apng")) return "image/apng"
    if (name.endsWith(".jfif")) return "image/jpeg"
    if (name.endsWith(".pjpeg")) return "image/jpeg"
    if (name.endsWith(".pjp")) return "image/jpeg"
    return "application/octet-stream";
};

const hashFile = (data: Buffer) => {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
}

export const createArTx = async (arweave: Arweave, data: Buffer, wallet: any, contentType: string) => {

    let tags = new Tags()
    tags.addTag('Content-Type', contentType)
    tags.addTag('User-Agent', "test")
    tags.addTag('User-Agent-Version', "0.2.0")
    tags.addTag('Type', 'file')
    tags.addTag('File-Hash', hashFile(data))

    let tx = await arweave.createTransaction({ data }, wallet)
    tags.addTagsToTransaction(tx)

    return tx
}

export const signArTx = async (arweave: Arweave, tx: Transaction, wallet: any) => {
    await arweave.transactions.sign(tx, wallet)
    return tx
}

export const submitArTx = async (arweave: Arweave, tx: Transaction) => new Promise(async (resolve, reject) => {
    let uploader = await arweave.transactions.getUploader(tx)
    try {
        while (!uploader.isComplete) {
            await uploader.uploadChunk()
        }
    } catch (err) {
        const comment = "Submit Arweave Tx error"
        Sentry.captureException(err, { extra: { comment } });
        if (uploader.lastResponseStatus > 0) {
            return reject({
                status: uploader.lastResponseStatus,
                statusText: uploader.lastResponseError,
            })
        }
    }

    resolve(tx.id)
})


export const uploadImage = async (file: Buffer, fileName: string): Promise<string> => {
    // let cache: any = {
    //     images: [],

    // }
    // let fullurl = "https://arweave.net";

    // let files = fs.readdirSync("./assets").filter((file) => file.endsWith(".json"))
    // let file = files[0]
    // let metadata = JSON.parse(fs.readFileSync("./assets/" + file, "utf-8"))
    
    const wallet = JSON.parse(process.env.ARWEAVE_WALLET || '{}');
    try {


        let tx = await createArTx(arweave, file, wallet, contentTypeOf(fileName))
        tx = await signArTx(arweave, tx, wallet)
        await submitArTx(arweave, tx)
        return tx.id

    } catch (e) {
        // console.log("Failed to upload image: "+ e)
        throw new Error(`File upload failed: ${e.message}`);
        // res.status(500).json({ error: 'Failed to upload to Arweave' });
    }
 

    // if (response.status === 200) {

    //             console.log(File uploaded: https://arweave.net/${transaction.id});
    //             return https://arweave.net/${transaction.id};
    //         } else {
    //             console.error('Failed to upload file:', response.status, response.statusText);
    //             throw new Error('File upload failed');
    //         }

}
