import { PDFDocument } from 'pdf-lib';

export async function generatePdf({ pdfBytes, images, scale, pageIndex = 0 }) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];

  const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();

  // Process each image
  for (const imageData of images) {
    const { bytes, position, dimensions } = imageData;

    // Embed the image
    let image;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    if (isPng) {
      image = await pdfDoc.embedPng(bytes);
    } else {
      image = await pdfDoc.embedJpg(bytes);
    }

    const imageWidthPdf = dimensions.width / scale;
    const imageHeightPdf = dimensions.height / scale;

    const xPdf = position.x / scale;
    // PDF Y is from bottom, Screen Y is from top
    const yPdf = pdfPageHeight - (position.y / scale) - imageHeightPdf;

    page.drawImage(image, {
      x: xPdf,
      y: yPdf,
      width: imageWidthPdf,
      height: imageHeightPdf,
    });
  }

  const pdfBytesSaved = await pdfDoc.save();
  return pdfBytesSaved;
}
