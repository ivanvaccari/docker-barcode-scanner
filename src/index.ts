import express, { NextFunction, Request, Response } from 'express';
import { env } from './env';
import { restValidator } from './lib/restValidator';
import { ScanBodyModel, ScanBodyModelJsonSchema } from './models/ScanBodyModel';
import { CustomError } from './lib/RestError';
import { BarcodeScanner } from './lib/BarcodeScanner';
import { ScanResultModelJsonSchema } from './models/ScanResultModel';
import { JSONSchemaFaker } from 'json-schema-faker';
import { asyncMiddleware } from './lib/asyncMiddleware';

const app = express();

app.use(express.json({ limit: env.MAX_BODY_SIZE })); //For parsing application/pdf

//For rendering the main web page
app.set('view engine', 'ejs');

/**
 * The main entry point to run the scan service.
 */
app.post('/api/scan', restValidator.body(ScanBodyModelJsonSchema), asyncMiddleware(async (req, res) => {
    const body: ScanBodyModel = req.body;
    const buffer = Buffer.from(body.bytes, 'base64');
    const scanner = new BarcodeScanner();
    const scanResult = await scanner.scan(buffer, req.body);
    res.json(scanResult);
}));

/**
 * Main web page. This is just a placeholder that displays some documentation
 */
app.get('/', (req, res, next) => {

    const data = {
        inputJsonSchema: ScanBodyModelJsonSchema,
        outputJsonSchema: ScanResultModelJsonSchema,
        inputSample: JSONSchemaFaker.generate(ScanBodyModelJsonSchema),
        version: env.PACKAGE_JSON.version,
    }

    res.render('landingpage', data, (err, html) => {
        if (err) { next(err); return; }
        res.send(html)
    })
})

/**
 * Error handler. Just sends out the error as a json response.
 */
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    let _error: CustomError;
    if (error instanceof CustomError) _error = error;
    else if (error instanceof Error) _error = new CustomError(error.message, { stack: error.stack }, 500);
    else _error = new CustomError('Internal server error', { error: error }, 500);

    res.status(error?.statusCode ?? 500).json(_error)
})

app.listen(env.PORT, () => {
    console.log(`Http server listening on port ${env.PORT}`)
})