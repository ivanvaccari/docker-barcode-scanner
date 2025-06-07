# docker-barcode-scanner

A microservice that scans for 1D/2D in images and pdf files.

This service offers just one REST API: `/api/scan` that takes all the needed data as input ad returns the found codes. It supports png images and PDF files.

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


## Run

TODO

## Usage

TODO