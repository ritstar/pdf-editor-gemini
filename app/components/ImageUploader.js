import { Image as ImageIcon } from 'lucide-react';

export default function ImageUploader({ onUpload }) {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            onUpload(file);
        } else {
            alert('Please upload a valid image file.');
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <label className="btn btn-secondary w-full gap-2">
                <ImageIcon size={18} />
                <span>Upload Overlay Image</span>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </div>
    );
}
