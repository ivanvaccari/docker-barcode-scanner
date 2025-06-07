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
import { ScanResultModel } from '../models/ScanResultModel';

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
    public async scan(buffer: Buffer, options: ScanOptions): Promise<ScanResultModel> {
        switch (options.contentType) {
            case 'image/png':
                return this.scanImage(buffer, options);
            case 'application/pdf':
                return this.scanPdf(buffer, options);
            default:
                throw new CustomError(`Unsupported content type: ${options.contentType}`, {}, 400);
        }
    }

    /**
     * Scan a pdf file buffer for a QR code.
     * 
     * @param buffer The PDF file buffer to scan.
     * @param options 
     */
    public async scanPdf(buffer: Buffer, options: ScanOptions): Promise<ScanResultModel> {
        const scanResult: ScanResultModel = {
            found: 0,
            results: [],
        };

        const rawData = new Uint8Array(buffer);
        // @ts-expect-error ignore typings
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.min.mjs");
        const pdfDocument = await pdfjsLib.getDocument(rawData).promise;

        // Prepare wich pages must be scanned
        let pagesNumbers = Array(pdfDocument.numPages).fill(0).map((_, i) => i + 1);
        if (options.pdfOptions?.pages) {
            // If specific pages are requested, use those instead
            pagesNumbers = options.pdfOptions.pages;
        }

        // Scan each page of the PDF document
        for (const pageNum of pagesNumbers) {
            const pageResult = await this.scanPdfPage(pdfDocument, pageNum, options);
            scanResult.found += pageResult.found;
            if (pageResult.results.length > 0) {
                scanResult.results!.push(...pageResult.results!);
            }
        }

        return scanResult;
    }

    /**
     * Extrapolate a single page from a PDF document and return it as a PNG image buffer.
     * 
     * @param pdfDocument The PDF document to render.
     * @param pageNum The page number to extract (1-based index).
     * @param options  
     * @returns 
     */
    private async extrapolatePdfPage(pdfDocument: any, pageNum: number, options: ScanOptions): Promise<Buffer> {
        const page = await pdfDocument.getPage(pageNum);

        // NOTE: scale is set to 2 because otherwise the image is too small and the qrcode 
        // gets lost in the noise.
        var viewport = page.getViewport({ scale: 2 });
        var canvasFactory: any = pdfDocument.canvasFactory;
        const canvasAndContext = canvasFactory.create(
            viewport.width,
            viewport.height
        );
        var renderContext = {
            canvasContext: canvasAndContext.context,
            viewport: viewport,
        };

        var renderTask = page.render(renderContext);
        await renderTask.promise;
        return canvasAndContext.canvas.toBuffer("image/png");
    }

    /**
     * Scan a specific page of a PDF document for a QR code.
     * 
     * @param pdfDocument The PDF document to scan.
     * @param pageNum The page number to scan (1-based index). 
     * @param options  
     * @returns 
     */
    private async scanPdfPage(pdfDocument: any, pageNum: number, options: ScanOptions): Promise<ScanResultModel> {
        const pageImageBuffer = await this.extrapolatePdfPage(pdfDocument, pageNum, options);
        const result = await this.scanImage(pageImageBuffer, options);
        result.results?.forEach((r) => r.index = pageNum);
        return result
    }

    /**
     * Scan a PNG image buffer for a QR code using both jsQR and ZXing libraries.
     * 
     * @param buffer The PNG image buffer to scan.
     * @returns An array of ScanImageResult objects containing the decoded QR code text and the engine used for decoding.
     */
    public async scanImage(buffer: Buffer, options: ScanOptions): Promise<ScanResultModel> {

        let result: ScanResultModel = {
            found: 0,
            results: [],
        }

        // Scan using scanJsqr. Use jsQR first as it's generally faster than zxing.
        let startTime = Date.now();
        try {

            const jsqrResult = await this.scanJsqr(buffer);
            if (jsqrResult) {
                result.found++;
                result.results.push({
                    text: jsqrResult,
                    engine: 'jsqr',
                    index: 0,
                    durationMs: Date.now() - startTime
                });
                // If jsQR found a QR code, return the result immediately
                return result;
            };

        } catch (error) {
            result.results.push({
                engine: 'zxing',
                error: error instanceof Error ? error.message : String(error),
                durationMs: Date.now() - startTime
            });
        }


        // If jsQR didn't find a QR code, try zxing
        startTime = Date.now();
        try {
            const zxingResult = await this.scanZxing(buffer);
            if (zxingResult) {
                result.found++;
                result.results.push({
                    text: zxingResult,
                    engine: 'zxing',
                    index: 0,
                    durationMs: Date.now() - startTime
                });
                // If zxing found a QR code, return the result immediately
                return result;
            }
        } catch (error) {
            result.results.push({
                engine: 'zxing',
                error: error instanceof Error ? error.message : String(error),
                durationMs: Date.now() - startTime
            });
        }


        return result;

    }

    /**
     * Scans a PNG image buffer for a QR code using ZXing libraries.
     * 
     * @param buffer The PNG image buffer to scan.
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
     * @param buffer The PNG image buffer to scan.
     * 
     * @returns A promise that resolves to the decoded QR code text or null if no QR code is found.
     */
    private async scanJsqr(buffer: Buffer): Promise<string | null> {

        const image = await Jimp.read(buffer)
        const value = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height);
        return value?.data ? value.data : null

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