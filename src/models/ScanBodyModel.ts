import { Type, type Static } from '@sinclair/typebox'


/**
 * Json schema for ScanBodyModel
 */
export const ScanBodyModelJsonSchema = Type.Object({
    contentType: Type.Enum({
        'application/pdf': 'application/pdf',
        'image/png': 'image/png',
    }),
    bytes: Type.String({ }),
    pdfOptions: Type.Optional(Type.Object({
        pages: Type.Optional(Type.Array(Type.Number()))
    })),
    crop: Type.Optional(Type.Object({
        x: Type.Optional(Type.Number()),
        y: Type.Optional(Type.Number()),
        width: Type.Optional(Type.Number()),
        height: Type.Optional(Type.Number())
    }))
}, {
    additionalProperties: false,
    title: 'ScanBodyModel',
    description: 'Model for the scan body request'
})

/**
 * The main Rest api input body model
 */
export type ScanBodyModel = Static<typeof ScanBodyModelJsonSchema>