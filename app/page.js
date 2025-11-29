'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Download } from 'lucide-react';
import PdfUploader from './components/PdfUploader';
import ImageUploader from './components/ImageUploader';
import SignatureUploader from './components/SignatureUploader';
import { generatePdf } from './utils/pdfGenerator';
import { removeWhiteBackground } from './utils/imageProcessing';

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

  const handleSignatureUpload = async (file) => {
    try {
      const processedFile = await removeWhiteBackground(file);

      const newImage = {
        id: Date.now() + Math.random(),
        file: processedFile,
        position: { x: 50, y: 50 }, // Default position slightly offset
        dimensions: null
      };
      setImages(prev => [...prev, newImage]);
    } catch (error) {
      console.error('Error processing signature:', error);
      alert('Failed to process signature. Please try another image.');
    }
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

  const handleImageResize = (imageId, newSize, positionDelta = { x: 0, y: 0 }) => {
    setImages(images.map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          dimensions: {
            ...img.dimensions,
            width: newSize.width,
            height: newSize.height
          },
          position: {
            x: img.position.x + positionDelta.x,
            y: img.position.y + positionDelta.y
          }
        };
      }
      return img;
    }));
  };

  const handleImageDelete = (imageId) => {
    setImages(images.filter(img => img.id !== imageId));
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
                    setImages([]);
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
                <ImageUploader onUpload={handleImageUpload} />
                <SignatureUploader onUpload={handleSignatureUpload} />

                {images.length > 0 && (
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
              images={images}
              onPositionChange={handlePositionChange}
              onScaleChange={setScale}
              onImageLoad={handleImageLoad}
              onImageResize={handleImageResize}
              onImageDelete={handleImageDelete}
            />
          </div>
        )}
      </div>
    </main>
  );
}
