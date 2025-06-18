# docker-barcode-scanner

A microservice that proveds a rest api to scan images and pdf files for barcodes and QRCodes. 

Supported formats:

| 1D product | 1D industrial                        | 2D           |
| ---------- |--------------------------------------|--------------|
| UPC-A      | Code 39                              | QR Code      |
| UPC-E      | Code 93                              | Data Matrix  |
| EAN-8      | Code 128                             | Aztec        |
| EAN-13     | Codabar                              | PDF 417      |
|            | ITF                                  |              |
|            | RSS-14                               |              |

This service internally uses [zxing](https://github.com/zxing-js/library/blob/075b1c6f6797831ad46507bb2e551d9b721ffcf3/README.md#supported-formats) to scan images. See zxing docs for info.

Docker image at [https://hub.docker.com/r/ivaccari/barcode-scanner](https://hub.docker.com/r/ivaccari/barcode-scanner)

## Requirements

- Node > 20.16.0

## Known bugs
- pdfjs-dist fails to render qrcodes generated using system fonts

## Usage

Run with docker using `docker run -e BEARER_TOKEN=myToken -p 3000:3000 ivaccari/barcode-scanner`, alternatively use docker-compose:

```yml
sevices:
  barcodescanner:
    image: ivaccari/barcode-scanner
    ports:
      - 3000:3000
    environment:
      - BEARER_TOKEN=myToken
```     


The service exposes the following routes:
- **GET /**: A placeholder page with some documentation
- **POST /api/scan**: the scan api

### Scan API

**Input model**: [./src/models/ScanBodyModel.ts](./src/models/ScanBodyModel.ts)

```js
{
    // The content type of the data passed in the bytes property. Supported: 'application/pdf', 'image/png', 'image/jpeg'.
    contentType: 'image/png',
    // The base64 encoded bytes of the image or PDF document to scan. The maximum size is limited by the MAX_BODY_SIZE env variable, which defaults to 10mb.
    bytes: 'aabf=',
    // Optional, Specific pdf options
    pdfOptions: {
        // Optional array of page numbers to scan in the PDF document. If not provided, all pages are scanned. Page numbers are 1-based.
        pages: [1,2],
        // Scale factor for the PDF pages. Default is 2. The higher scales might help for tiny qrcodes as the whole page is rendered with more resolution.
        scale: 2 
    },

    // Array of barcode formats to scan. If not provided, only 2D qrcodes are scanned. Valid only for zxing engine.
    // See [zxing](https://github.com/zxing-js/library/blob/8b5bf582f0ba7df97d6fcade6560e34e75083aa3/src/core/BarcodeFormat.ts#L28) docs for values.
    formats: ['QR_CODE'], 

    // Optional, array of crop definitions to be applied to the image before parsing. If you know the area where the QRCode
    // is expected to be placed, cropping the images to that area dramatically increases scan performance.
    // Also valid for PDF. Measurements refer to the whole page.
    // Multiple crops can be applied to parse different regiorn of interests in the same image or PDF page.
    crop: [{
        // X coordinate of the top-left corner of the crop area. Value is in % of the image width.
        x: 50,
        // Y coordinate of the top-left corner of the crop area. Value is in % of the image height.
        y: 50,
        // Width of the crop area. Value is in % of the image width.
        width: 50
        // Height of the crop area. Value is in % of the image height.
        height: 50
    }],   
}
```

**Output model**: see [./src/models/ScanResultModel.ts](./src/models/ScanResultModel.ts)

### Authentication

The service requires the usage of a Bearer token for authentication. The token must be passed in the `Authorization` header of the request. You can set the service expected token using the `BEARER_TOKEN` environment variable.

### Env Variables

- `BEARER_TOKEN`: Required, the Bearer token to access the APIs enndpoints.
- `PORT`: Optional, the port to run the service on. Defaults to 3000.
- `MAX_BODY_SIZE`: Optional, the maximum body size for the request. Defaults to 10mb.


### Examples

#### Basic
This examples just run the scan for a image. NOTE: Multiple QRCodes on a single image are not supported unless you use `crop` to cut areas to be processed singularly.

```js

import fetch from 'node-fetch';

// Just run the scan for a image
const image = fs.readFileSync('path/to/image.png');
const response = await fetch('http://localhost:3000/api/scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer myToken',
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        contentType: 'image/png',
        bytes: image.toString('base64'),
    }),
});
console.log(await response.json());
// Output: { found:1, results: [{engine: 'zxing', text: 'https://example.com' }]}
```

#### PDF
This examples scans all the pdf pages for qrcodes. NOTE: Multiple QRCodes on a single page are not supported unless you use `crop` to cut areas to be processed singularly.
```js

import fetch from 'node-fetch';

// Just run the scan for a image
const document = fs.readFileSync('path/to/document.pdf');
const response = await fetch('http://localhost:3000/api/scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer myToken',
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        contentType: 'applicaton/pdf',
        bytes: document.toString('base64'),
    }),
});
console.log(await response.json());
// Output: { found:1, results: [{engine: 'zxing', text: 'https://example.com', index: 0 }]}
```

#### PDF with crop and pages
This example scans the 2nd and 3rd page of the passed in pdf, but only the top-right quarter of the page (in order to reduce the processing time):

```
---------
|   | X |
|   -----
|       |
---------
```


```js

import fetch from 'node-fetch';

// Just run the scan for a image
const document = fs.readFileSync('path/to/document.pdf');
const response = await fetch('http://localhost:3000/api/scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer myToken',
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        contentType: 'applicaton/pdf',
        bytes: document.toString('base64'),
        pdfOptions: { pages: [2, 3]},
        crop: [{x:50, y:0, width: 50, height: 50}], // any value is in percentages of the page size. 0 starts at top-left
    }),
});
console.log(await response.json());
// Output: { found:2, results: [{engine: 'zxing', text: 'https://example.com', index: 2 },{engine: 'zxing', text: 'https://example.com', index: 3 }]}
```
