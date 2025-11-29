export const removeWhiteBackground = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Threshold for "white" - pixels brighter than this will be made transparent
                const threshold = 240;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // If pixel is white (or close to white), make it transparent
                    if (r > threshold && g > threshold && b > threshold) {
                        data[i + 3] = 0; // Set alpha to 0
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create a new File object from the blob to keep the name/type
                        const processedFile = new File([blob], file.name, { type: 'image/png' });
                        resolve(processedFile);
                    } else {
                        reject(new Error('Failed to process image'));
                    }
                }, 'image/png');
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
