'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Download } from 'lucide-react';
import PdfUploader from './components/PdfUploader';
import ImageUploader from './components/ImageUploader';
import { generatePdf } from './utils/pdfGenerator';

const PdfEditor = dynamic(() => import('./components/PdfEditor'), { ssr: false });

export default function Home() {
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);
  const [scale, setScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (file) => {
    const newImage = {
      id: Date.now() + Math.random(), // Unique ID
      file: file,
      position: { x: 0, y: 0 },
      dimensions: null
    };
    setImages([...images, newImage]);
  };

  const handlePositionChange = (imageId, position) => {
    setImages(images.map(img =>
      img.id === imageId ? { ...img, position } : img
    ));
  };

  const handleImageLoad = (imageId, dimensions) => {
    setImages(images.map(img =>
      img.id === imageId ? { ...img, dimensions } : img
    ));
  };

  const handleDownload = async () => {
    if (!pdfFile || images.length === 0) return;

    // Filter out images that don't have dimensions set yet
    const validImages = images.filter(img => img.dimensions);
    if (validImages.length === 0) {
      alert('Please wait for images to load before downloading.');
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();

      // Convert all images to array buffers
      const imagesData = await Promise.all(
        validImages.map(async (img) => ({
          bytes: await img.file.arrayBuffer(),
          position: img.position,
          dimensions: img.dimensions
        }))
      );

      const modifiedPdfBytes = await generatePdf({
        pdfBytes,
        images: imagesData,
        scale
      });

      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modified_document.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="main-container">
      <div className="content-wrapper">
        <header className="header">
          <h1 className="title">
            PDF Editor
          </h1>
          <p className="subtitle">
            Upload a PDF, add an image overlay, and download the result.
          </p>
        </header>

        {!pdfFile ? (
          <PdfUploader onUpload={setPdfFile} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="toolbar">
              <div className="toolbar-left">
                <button
                  onClick={() => {
                    setPdfFile(null);
                    setImageFile(null);
                    setImageDimensions(null);
                  }}
                  className="back-btn"
                >
                  ← Upload different PDF
                </button>
                <span className="file-name">
                  {pdfFile.name}
                </span>
              </div>

              <div className="toolbar-right">
                {!imageFile && (
                  <ImageUploader onUpload={setImageFile} />
                )}

                {imageFile && (
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    <Download size={18} />
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                  </button>
                )}
              </div>
            </div>

            <PdfEditor
              pdfFile={pdfFile}
              imageFile={imageFile}
              onPositionChange={setPosition}
              onScaleChange={setScale}
              onImageLoad={setImageDimensions}
            />
          </div>
        )}
      </div>
    </main>
  );
}
