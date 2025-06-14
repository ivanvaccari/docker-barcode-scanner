import { Type, type Static } from '@sinclair/typebox'

/**
 * Json schema for ScanResultModel
 */
export const ScanResultModelJsonSchema = Type.Object({
    found: Type.Number(),
    results: Type.Array(Type.Object({
        engine: Type.Enum({
            'zxing': 'zxing',
            'jsqr': 'jsqr',
        }, { description: 'The engine used to scan the QRCode.' }),
        text: Type.Optional(Type.String({ description: 'Decoded text from the QRCode.' })),
        index: Type.Optional(Type.Number({ description: 'Index of the QRCode. For images, this is always 0. For PDFs, this is the page number.' })),
        error: Type.Optional(Type.String({ description: 'Error message if any error occurred during scanning.' })),
        durationMs: Type.Number({ description: 'Duration of this scan pass in milliseconds. NOTE: this does not includes eventually needed format conversions.' })
    }))

})
/**
 * The main Rest api input body model
 */
export type ScanResultModel = Static<typeof ScanResultModelJsonSchema>