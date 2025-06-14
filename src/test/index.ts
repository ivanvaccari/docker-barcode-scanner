import assert from 'assert';
import { describe, it } from 'mocha';
import fs from 'fs';
import path from 'path';
import { BarcodeScanner } from '../lib/BarcodeScanner.js';

/***
 * files: 
 * - 5.jpg
 * - IMG20250608093332.jpg
 * - multiple.pdf
 * - personalizza-card-con-qrcode.jpg
 * - qrcode-on-page-2.pdf
 * - qrcode-reader-0.png
 * - thank-you-card2.png
 */
describe('Image scan', () => {

    // file: 5.jpg
    it("Should find a qrcode in 5.jpg without crop", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/5.jpg'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg'
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://www.ericestampa.it/prodotto/segnatavolo-con-qrcode/', 'Should find a QR code');
    });

    // file: 5.jpg
    it("Should NOT find a qrcode in 5.jpg with bad crop", async () => {
        
        // Image badly cropped, should not find a QR code
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/5.jpg'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg',
            crop: [{
                x: 0,
                y: 0,
                width: 50,
                height: 50
            }]
        });
        assert.equal(result.found, 0, 'Should NOT find any barcode');
    });

    // file: 5.jpg
    it("Should find a qrcode in 5.jpg with good crop", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/5.jpg'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg',
            crop: [{
                x: 30,
                y: 30,
                width: 30,
                height: 30
            }]
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://www.ericestampa.it/prodotto/segnatavolo-con-qrcode/', 'Should find a QR code');
    });

    // file: IMG20250608093332.jpg
    it("Should find a qrcode in IMG20250608093332.jpg without crop", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/IMG20250608093332.jpg'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg'
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://h5.nutspace.com/app/download?app=findthing', 'Should find a QR code');
    }).timeout(5000) // his image is very big and takes a while to process

    // file: multiple.pdf
    it("Should find the lower qrcode in 2nd page of multiple.pdf", async () => {
        const pdf = fs.readFileSync(path.join(__dirname, '../../test-assets/multiple.pdf'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(pdf, {
            contentType: 'application/pdf',
            pdfOptions: {
                pages: [2] // Only scan the first page
            },

            // crops the page to  the lower 1/4 of a page, from center to right
            crop: [{
                x: 50,
                y: 75,
                width: 50,
                height: 25
            }]
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, '(444) 666-1212', 'Should find a QR code');
    }).timeout(5000);

    // file: personalizza-card-con-qrcode.jpg
    it("Should find a qrcode in personalizza-card-con-qrcode.jpg", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/personalizza-card-con-qrcode.jpg'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg'
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://www.rawpixel.com', 'Should find a QR code');
    });

    // file: qrcode-on-page-2.pdf
    it("Should find a qrcode in qrcode-on-page-2.pdf", async () => {
        const pdf = fs.readFileSync(path.join(__dirname, '../../test-assets/qrcode-on-page-2.pdf'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(pdf, {
            contentType: 'application/pdf',
            pdfOptions: {
                pages: [2] // Only scan the first page
            }
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Should find a QR code');
    });

    // file: qrcode-reader-0.png
    it("Should find a qrcode in qrcode-reader-0.png", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/qrcode-reader-0.png'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/jpeg'
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://twitter.com/appcodamobile', 'Should find a QR code');
    });

    // file: thank-you-card2.png
    it("Should find a qrcode in thank-you-card2.png", async () => {
        const image = fs.readFileSync(path.join(__dirname, '../../test-assets/thank-you-card2.png'));
        const scanner = new BarcodeScanner();
        const result = await scanner.scan(image, {
            contentType: 'image/png'
        });
        assert.equal(result.found, 1, 'Should find exactly one barcode');
        assert.equal(result.results[0].text, 'https://ekstones.com', 'Should find a QR code');
    });

});