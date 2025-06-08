import { Type, type Static } from '@sinclair/typebox'
import { env } from '../env'
import { BarcodeFormat } from '@zxing/library'


const barcodeFormats = Object.values(BarcodeFormat);
const barcodeFormatsForEnum = barcodeFormats.reduce((acc, format) => {
    acc[format] = format as string;
    return acc;
}, {} as { [k: string]: string });

/**
 * Json schema for ScanBodyModel
 */
export const ScanBodyModelJsonSchema = Type.Object({
    contentType: Type.Enum({
        'application/pdf': 'application/pdf',
        'image/png': 'image/png',
        'image/jpeg': 'image/jpeg',
    }, { description: 'Content type of the file expressed in <bytes> property.' }),

    bytes: Type.String({
        description: 'Base64 encoded bytes of the image or PDF file to scan. Size limit: ' + env.MAX_BODY_SIZE
    }),

    pdfOptions: Type.Optional(Type.Object({
        pages: Type.Optional(Type.Array(Type.Number(), {
            description: 'Array of page numbers to scan, starting from 1. If not provided, all pages will be scanned.'
        })),
        scale: Type.Optional(Type.Number({
            description: 'Scale factor for the PDF pages. Default is 2. The higher scales might help for tiny qrcodes as the whole page is rendered with more resolution.'
        })),
    })),

    formats: Type.Optional(Type.Array(Type.Enum(barcodeFormatsForEnum), {
        description: 'Array of barcode formats to scan. If not provided, only 2D qrcodes are scanned. Valid only for zxing engine.'
    })),

    crop: Type.Optional(Type.Array(Type.Object({
        x: Type.Number({ description: 'X coordinate of the top-left corner of the crop area. Value is in % of the image width.', maximum: 100, minimum: 0 }),
        y: Type.Number({ description: 'Y coordinate of the top-left corner of the crop area. Value is in % of the image height', maximum: 100, minimum: 0 }),
        width: Type.Number({ description: 'Width of the crop area. Value is in % of the image width.', maximum: 100, minimum: 0 }),
        height: Type.Number({ description: 'Height of the crop area. Value is in % of the image height.', maximum: 100, minimum: 0 })
    }), {
        description: 'Array of crop definitions to be applied to the image before parsing. If you know the area where the QRCode is expected to be placed, cropping the images to that area dramatically increases scan performance. Also valid for PDF, where measurements refer to the whole page.'
    })),

}, {
    additionalProperties: false,
    title: 'ScanBodyModel',
    description: 'Scan REST api input model'
})

/**
 * The main Rest api input body model
 */
export type ScanBodyModel = Static<typeof ScanBodyModelJsonSchema>