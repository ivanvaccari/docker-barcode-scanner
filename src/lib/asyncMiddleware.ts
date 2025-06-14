import { NextFunction, Request, Response } from "express";

/**
 * A wrapper for express middlewares that allows the use of async functions.
 * 
 * @param asyncExpressmiddleware A function that takes a request, response and next function and returns a promise.
 * @returns 
 */
export function asyncMiddleware(asyncExpressmiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        asyncExpressmiddleware(req, res, next)
            .catch((err) => {
                next(err);
            });
    };
}