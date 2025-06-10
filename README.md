# docker-barcode-scanner

# NOTE: WIP, NOT PRODUCTION READY at 10-06-2025

A microservice that scans for 1D/2D in PNG images, JPEG images and PDF files.

Supported 1D/2D formats:

| 1D product | 1D industrial                        | 2D           |
| ---------- |--------------------------------------|--------------|
| UPC-A      | Code 39                              | QR Code      |
| UPC-E      | Code 93                              | Data Matrix  |
| EAN-8      | Code 128                             | Aztec        |
| EAN-13     | Codabar                              | PDF 417      |
|            | ITF                                  |              |
|            | RSS-14                               |              |

See zxing [library](https://github.com/zxing-js/library/blob/075b1c6f6797831ad46507bb2e551d9b721ffcf3/README.md#supported-formats) for more info.

## Usage

Run with docker using `docker run -e BEARER_TOKEN=myToken -p 3000:3000 ivanva/docker-barcode-scanner`.

The service exposes a single scan api at `POST /api/scan` on the listening port.

**Input model**: [./src/models/ScanBodyModel.ts](./src/models/ScanBodyModel.ts)

**Output model**: [./src/models/ScanResultModel.ts](./src/models/ScanResultModel.ts)

### Env Variables

- `BEARER_TOKEN`: Required, the Bearer token to access the APIs enndpoints.
- `PORT`: Optional, the port to run the service on. Defaults to 3000.
- `MAX_BODY_SIZE`: Optional, the maximum body size for the request. Defaults to 10mb.


### Examples

#### Basic
This examples just run the scan for a image:

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
This examples scans all the pdf pages for qrcodes:

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
        crop: [{x:50, y:0, width: 50, height: 50}], // any value is in percentages of the page size
    }),
});
console.log(await response.json());
// Output: { found:2, results: [{engine: 'zxing', text: 'https://example.com', index: 2 },{engine: 'zxing', text: 'https://example.com', index: 3 }]}
```
