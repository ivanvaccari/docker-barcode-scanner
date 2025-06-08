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
import { ScanBodyModel } from '../models/ScanBodyModel';
import { CustomError } from './RestError';
import { ScanResultModel } from '../models/ScanResultModel';


/**
 * Scanner options. Same as ScanBodyModel but without the bytes field
 * that must be provided as a buffer
 */
export type ScanOptions = Omit<ScanBodyModel, 'bytes'>


export class BarcodeScanner {

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
            case 'image/jpeg':
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
        var viewport = page.getViewport({ scale: options.pdfOptions?.scale || 2 });
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
     * @param buffer The Jpeg or PNG image buffer to scan.
     * @returns An array of ScanImageResult objects containing the decoded QR code text and the engine used for decoding.
     */
    public async scanImage(buffer: Buffer, options: ScanOptions): Promise<ScanResultModel> {

        let result: ScanResultModel = {
            found: 0,
            results: [],
        }

        // Prepare an array of buffers to be analyzed. 
        let buffers: Buffer[] = [];

        // If crop options are provided, apply them to the image.
        // This produces a series of buffers to be scanned. All of them will be scanned.
        if (Array.isArray(options.crop) && options.crop.length > 0) {
            const image = await Jimp.read(buffer);
            for (const crop of options.crop) {
                // coordinates are expressed in percentage of the image size to ignore actual sizing in pixels.
                const x = Math.floor(image.bitmap.width * crop.x / 100);
                const y = Math.floor(image.bitmap.height * crop.y / 100);
                const width = Math.floor(image.bitmap.width * crop.width / 100);
                const height = Math.floor(image.bitmap.height * crop.height / 100);

                // Crop the imahge and scan the cropped area
                const croppedImage = await image.clone().crop({ x: x, y: y, w: width, h: height });
                buffers.push(await croppedImage.getBuffer('image/png'));
            }
        } else {
            // If no cropping is applied, just use the original buffer
            buffers = [buffer];
        }

        // Prepare the formats to be used for scanning.
        const formats = this.getformats(options);

        // Process all the buffers. If cropping was applied, this will be multiple buffers
        // If no cropping was applied, this will be a single buffer.
        for (const _buffer of buffers) {

            // Scan using scanJsqr. Use jsQR first as it's generally faster than zxing.
            // NOTE: this however works only with QR codes, so if the formats include other types of barcodes,
            // it will skip them internally.
            let startTime = Date.now();
            try {
                const jsqrResult = await this.scanJsqr(_buffer, formats, options);
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
                    engine: 'jsqr',
                    error: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - startTime
                });
            }


            // If jsQR didn't find a QR code, try zxing
            startTime = Date.now();
            try {
                const zxingResult = await this.scanZxing(_buffer, formats, options);
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
        }

        return result;

    }

    /**
     * Calculates the barcode formats to be used for scanning based on the provided options.
     * 
     * @param options Scan options body
     * @returns 
     */
    private getformats(options: ScanOptions): BarcodeFormat[] {
        const formats = [];
        if (Array.isArray(options.formats) && options.formats.length > 0) {
            for (const format of options.formats) {
                if (BarcodeFormat[format as keyof typeof BarcodeFormat] !== undefined) {
                    formats.push(BarcodeFormat[format as keyof typeof BarcodeFormat]);
                } else {
                    throw new CustomError(`Unsupported barcode format: ${format}`, {}, 400);
                }
            }
        } else {
            // If no formats are specified, use the default 2D QR code formats
            formats.push(BarcodeFormat.QR_CODE);
        }

        return formats;
    }
    /**
     * Scans a PNG image buffer for a QR code using ZXing libraries.
     * 
     * @param buffer The png or jpeg image buffer to scan.
     * @param options The options for scanning, including barcode formats.
     * 
     * @returns A promise that resolves to the decoded QR code text or null if no QR code is found.
     */
    private async scanZxing(buffer: Buffer, formats: BarcodeFormat[], options: ScanOptions): Promise<string | null> {
        
        // Convert the image to a format suitable for ZXing
        // See ZXIng documentation for more details on how to convert images
        const image = await Jimp.read(buffer);
        const luminancesUint8Array = new Uint8ClampedArray(image.bitmap.data.length);
        for (let i = 0; i < image.bitmap.data.length; i++) {
            luminancesUint8Array[i] = ((image.bitmap.data[i * 4] + image.bitmap.data[i * 4 + 1] * 2 + image.bitmap.data[i * 4 + 2]) / 4) & 0xFF;
        }
        const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, image.bitmap.width, image.bitmap.height);
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new MultiFormatReader();
        const decoded = reader.decode(binaryBitmap, hints);
        const text = decoded.getText()
        if (text) return text;
        return null
    }


    /**
     * Scan a converted grayscale image buffer for a QR code using the jsQR library.
     * 
     * @param buffer The image buffer to scan. Supported formats are PNG and JPEG.
     * 
     * @returns A promise that resolves to the decoded QR code text or null if no QR code is found.
     */
    private async scanJsqr(buffer: Buffer, formats: BarcodeFormat[], options: ScanOptions): Promise<string | null> {


        // jsQR only supports QR codes. Skip this if the format is not QR_CODE.
        if (!formats.includes(BarcodeFormat.QR_CODE)) {
            return null;
        }

        const image = await Jimp.read(buffer)
        const value = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height);
        return value?.data ? value.data : null

    }


}