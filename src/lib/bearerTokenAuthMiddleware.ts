import { Request, Response } from "express";
import { CustomError } from "./RestError";
import { env } from "../env";

/**
 * A simple bearer token authentication middleware. Just checks the passed-in bearer token against
 * the one defined in the environment variable
 * 
 */
export function bearerTokenAuthMiddleware(req: Request, res: Response, next: any) {

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next(new CustomError('Unauthorized', 401));

    const token = authHeader.split(' ')[1];
    if (token !== env.BEARER_TOKEN) return next(new CustomError('Unauthorized', 401));

    next();

}