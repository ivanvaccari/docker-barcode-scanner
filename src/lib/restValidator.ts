import Ajv from "ajv";
import { CustomError } from "./RestError";
import { TObject } from "@sinclair/typebox";
import { Request, Response, NextFunction} from "express";

const ajv = new Ajv({ strict: true, verbose: true })

/**
 * Validates the request body with the provided json schema
 * 
 * @param schema The json schema to validate against
 * @returns A express middleware function that validates the request body and optionally 
 * throws a CustomError if the validation fails
 */
function body<SCHEMA extends TObject>(schema: SCHEMA) {

    const validate = ajv.compile(schema)

    return (req: Request, res: Response, next: NextFunction) => {
        const valid = validate(req.body);

        // If the body is not valid, throw a CustomError with the validation errors
        if (!valid) return next(new CustomError('invalid', validate.errors, 400))

        // If the body is valid, just continue to the next middleware
        next();
    }
}

export const restValidator = {
    body: body
}