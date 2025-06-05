/**
 * CustomError class for handling REST API errors.
 */
export class CustomError extends Error {

    constructor(public message: string, public detail: any, public statusCode: number = 500) {
        super(message);
    }

    /**
     * Automatic converion to JSON format when the error is sent as a response.
     * 
     * @returns 
     */
    toJSON() {
        return {
            message: this.message,
            detail: this.detail,
            statusCode: this.statusCode
        }
    }
}