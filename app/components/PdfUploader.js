import { Upload } from 'lucide-react';

export default function PdfUploader({ onUpload }) {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            onUpload(file);
        } else {
            alert('Please upload a valid PDF file.');
        }
    };

    return (
        <div className="card uploader-card">
            <label className="cursor-pointer flex flex-col items-center gap-4 w-full">
                <div className="icon-wrapper">
                    <Upload size={32} />
                </div>
                <div className="text-center">
                    <h3 className="uploader-title">Upload PDF Document</h3>
                    <p className="uploader-subtitle">Drag and drop or click to browse</p>
                </div>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </div>
    );
}
