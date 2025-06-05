import express, { NextFunction, Request, Response } from 'express';
import { env } from './env';
import { restValidator } from './lib/restValidator';
import { ScanBodyModelJsonSchema } from './models/ScanBodyModel';
import { CustomError } from './lib/RestError';

const app = express();

app.use(express.json());

/**
 * The main entry point to run the scan service.
 */
app.post('/api/scan', restValidator.body(ScanBodyModelJsonSchema), (req, res) => {
    res.send("TODO")
    res.end();
})

/**
 * Error handler. Just sends out the error as a json response.
 */
app.use((error: CustomError, req: Request, res: Response, next: NextFunction) => {
    res.status(error?.statusCode ?? 500).json(error)
})

app.listen(env.PORT, () => {
    console.log(`Http server listening on port ${env.PORT}`)
})