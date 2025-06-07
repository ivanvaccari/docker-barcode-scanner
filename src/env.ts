

export const env = {

    /**
     * Listen port for the server.
     * Defaults to 3000
     */
    PORT: process.env.PORT || 3000,

    /**
     * Bearer token for rest api authentication.
     */
    BEARER_TOKEN: process.env.BEARER_TOKEN || '',

    /**
     * Maximum body size for the request.
     * Must be accepted by the express.json() middleware.
     * Defaults to 10mb.
     */
    MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || '10mb',
}