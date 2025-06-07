import { Type, type Static } from '@sinclair/typebox'


/**
 * Json schema for ScanImageResult
 */
export const ScanImageResultJsonSchema = Type.Object({
    engine: Type.Enum({
        'zxing': 'zxing',
        'jsqr': 'jsqr',
    }),
    text: Type.String({})
}, {
    additionalProperties: false,
    title: 'ScanBodyModel',
    description: 'Scan result'
})

/**
 * The main Rest api input body model
 */
export type ScanImageResult = Static<typeof ScanImageResultJsonSchema>