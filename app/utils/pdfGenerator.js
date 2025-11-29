import { PDFDocument } from 'pdf-lib';

export async function generatePdf({ pdfBytes, imageBytes, position, scale, pageIndex = 0, imageDimensions }) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  
  // Embed the image
  let image;
  // Detect image type roughly
  const isPng = imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4E && imageBytes[3] === 0x47;
  if (isPng) {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    image = await pdfDoc.embedJpg(imageBytes);
  }

  const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
  
  // Calculate dimensions and position in PDF coordinates
  // position.x and position.y are in screen pixels relative to the PDF container
  // scale is the ratio of screen pixels to PDF points (if scale=1, 1px = 1pt)
  // Actually, react-pdf scale is usually 1 = 72dpi? No, usually 1 = 1 point = 1/72 inch.
  
  const imageWidthPdf = imageDimensions.width / scale;
  const imageHeightPdf = imageDimensions.height / scale;
  
  const xPdf = position.x / scale;
  // PDF Y is from bottom, Screen Y is from top
  const yPdf = pdfPageHeight - (position.y / scale) - imageHeightPdf;

  page.drawImage(image, {
    x: xPdf,
    y: yPdf,
    width: imageWidthPdf,
    height: imageHeightPdf,
  });

  const pdfBytesSaved = await pdfDoc.save();
  return pdfBytesSaved;
}
