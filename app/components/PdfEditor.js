'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfEditor({ pdfFile, imageFile, onPositionChange, onScaleChange, onImageLoad }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(null);
    const containerRef = useRef(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    // Handle container resize to adjust PDF scale
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setContainerWidth(width);
                // Approximate scale based on standard A4 width (approx 600px)
                // Adjust this logic if needed for better responsiveness
                // For now, we let react-pdf handle width, and we calculate scale from it
            }
        };

        window.addEventListener('resize', updateWidth);
        updateWidth();
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Load image dimensions when imageFile changes
    useEffect(() => {
        if (imageFile) {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                if (img.width > 0) {
                    // Initial display size (e.g., max 200px width, min 50px)
                    const displayScale = Math.min(200 / img.width, 1);
                    const dimensions = {
                        width: Math.max(50, img.width * displayScale),
                        height: Math.max(50, img.height * displayScale),
                        originalWidth: img.width,
                        originalHeight: img.height
                    };
                    setImageDimensions(dimensions);
                    if (onImageLoad) onImageLoad(dimensions);
                }
            };
        }
    }, [imageFile]);

    const handleDragStop = (e, data) => {
        onPositionChange({ x: data.x, y: data.y });
    };

    const draggableRef = useRef(null);

    return (
        <div className="editor-container" ref={containerRef}>
            <div className="pdf-wrapper">
                <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex justify-center"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={containerWidth ? Math.min(containerWidth, 800) : 600}
                        onRenderSuccess={(page) => {
                            const currentScale = page.width / page.originalWidth;
                            onScaleChange(currentScale);
                            setScale(currentScale);
                        }}
                    />
                </Document>

                {imageFile && imageDimensions.width > 0 && (
                    <div className="overlay-container">
                        <Draggable
                            bounds="parent"
                            position={null}
                            onStop={handleDragStop}
                            defaultPosition={{ x: 0, y: 0 }}
                            nodeRef={draggableRef}
                        >
                            <div
                                ref={draggableRef}
                                style={{
                                    width: imageDimensions.width,
                                    height: imageDimensions.height,
                                }}
                                className="draggable-image"
                            >
                                <img
                                    src={URL.createObjectURL(imageFile)}
                                    alt="Overlay"
                                    draggable={false}
                                />
                            </div>
                        </Draggable>
                    </div>
                )}
            </div>

            {numPages && (
                <div className="flex items-center gap-4" style={{ marginTop: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    <span>
                        Page {pageNumber} of {numPages}
                    </span>
                    <button
                        className="btn btn-secondary"
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
