/*************************************************************************
*
* Copyright (C) 2019 - Mitech srl
* __________________
*
* NOTICE:  All information contained in this file is, and remains
* property of Mitech srl.
* The intellectual and technical concepts contained herein are proprietary to
* Mitech Srl.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Mitech srl.
*
***************************************************************************/

import { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } from '@zxing/library';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { ScanBodyModel } from '../models/ScanBodyModel';
import { CustomError } from './RestError';
import { ScanImageResult } from '../models/ScanimageResult';

/**
 * Setup some hints for the zxing QR code reader.
 */
const hints = new Map();
const formats = [BarcodeFormat.QR_CODE];
hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
hints.set(DecodeHintType.TRY_HARDER, true);
const reader = new MultiFormatReader();
reader.setHints(hints);



/**
 * Scanner options. Same as ScanBodyModel but without the bytes field
 * that must be provided as a buffer
 */
export type ScanOptions = Omit<ScanBodyModel, 'bytes'>


export class QRCodeScanner {

    /**
     * Scan a buffer for a QR code using the specified options.
     * 
     * @param buffer The buffer to scan, typically a PNG image.
     * @param options 
     * @returns 
     */
    public scan(buffer: Buffer, options: ScanOptions): Promise<ScanImageResult|null> {
        switch (options.contentType) {
            case 'image/png': return this.scanImage(buffer, options);
            default:
                throw new CustomError(`Unsupported content type: ${options.contentType}`, {}, 400);
        }
    }

    /**
     * Scan a PNG image buffer for a QR code using both jsQR and ZXing libraries.
     * 
     * @param buffer The PNG image buffer to scan.
     * @returns An array of ScanImageResult objects containing the decoded QR code text and the engine used for decoding.
     */
    public async scanImage(buffer: Buffer, options: ScanOptions): Promise<ScanImageResult | null> {
        // Scan using scanJsqr. Use jsQR first as it's generally faster than zxing.
        const jsqrResult = await this.scanJsqr(buffer);
        if (jsqrResult) {
            return { text: jsqrResult, engine: 'jsqr' };
        }

        // If jsQR didn't find a QR code, try zxing
        const zxingResult = await this.scanZxing(buffer);
        if (zxingResult) {
            return { text: zxingResult, engine: 'zxing' };
        }

        return null; // If no QR code was found, return null

    }

    /**
     * Scans a PNG image buffer for a QR code using ZXing libraries.
     * 
     * @param grayscaleImage The grayscale image buffer to scan.
     * @param width The width of the image.
     * @param height The height of the image. 
     * 
     * @returns A promise that resolves to the decoded QR code text or null if no QR code is found.
     */
    private async scanZxing(buffer: Buffer): Promise<string | null> {
        const { binaryBitmap } = await this.pngBufferToBinaryBitmap(buffer);
        const decoded = reader.decode(binaryBitmap);
        const text = decoded.getText()
        if (text) return text;
        return null

    }


    /**
     * Scan a converted grayscale image buffer for a QR code using the jsQR library.
     * 
     * @param grayscaleImage The grayscale image buffer to scan.
     * @param width The width of the image.
     * @param height The height of the image. 
     * 
     * @returns A promise that resolves to the decoded QR code text or null if no QR code is found.
     */

    private async scanJsqr(buffer: Buffer): Promise<string | null> {
        try {
            const image = await Jimp.read(buffer)
            const value = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height);
            return value?.data ? value.data : null
        } catch (error) {
            return null;
        }

    }

    /**
     * Converts a buffer containing a PNG image to a BinaryBitmap
     * 
     * @param buffer The PNG image buffer to convert.
     * @returns 
     */
    private async pngBufferToBinaryBitmap(buffer: Buffer): Promise<{ binaryBitmap: BinaryBitmap, width: number, height: number }> {
        var png = new PNG();


        const { width, height, data } = await new Promise<PNG>((resolve, reject) => {
            png.parse(buffer, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

        const len = width * height;
        const luminancesUint8Array = new Uint8ClampedArray(len);
        for (let i = 0; i < len; i++) {
            luminancesUint8Array[i] = ((data[i * 4] + data[i * 4 + 1] * 2 + data[i * 4 + 2]) / 4) & 0xFF;
        }

        const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, width, height);
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        return { binaryBitmap: binaryBitmap, width: width, height: height };
    }

}