
import fs from 'fs';

if (!process.env.BEARER_TOKEN) throw new Error('Environment variable BEARER_TOKEN is not set. Please set it to a valid token for authentication.');

/**
 * Environment variables for the application.
 * This file reads environment variables and provides defaults.
 */
export const env = {

    /**
     * Listen port for the server.
     * Defaults to 3000
     */
    PORT: process.env.PORT || 3000,

    /**
     * Bearer token for rest api authentication.
     */
    BEARER_TOKEN: process.env.BEARER_TOKEN,

    /**
     * Maximum body size for the request.
     * Must be accepted by the express.json() middleware.
     * Defaults to 10mb.
     */
    MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || '10mb',

    /**
     * A copy of the package.json file.
     */
    PACKAGE_JSON: JSON.parse(fs.readFileSync('./package.json', 'utf-8')),

    /**
     * If true, write to ./image-debug the image being processed by the scanner.
     */
    IMAGE_DEBUG: process.env.IMAGE_DEBUG === 'true' || false,
}

