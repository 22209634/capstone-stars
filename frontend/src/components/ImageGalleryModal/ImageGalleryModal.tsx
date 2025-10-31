import './ImageGalleryModal.css';
import { X, Download, Check } from 'lucide-react';
import { useState } from 'react';

interface CapturedImage {
  id: string;
  url: string;
  timestamp: Date;
  ra: number;
  dec: number;
  mode: 'simulation' | 'ascom';
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: CapturedImage[];
}

export default function ImageGalleryModal({ isOpen, onClose, images }: ImageGalleryModalProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleDownload = async () => {
    if (selectedImages.size === 0) {
      alert('Please select at least one image to download');
      return;
    }

    if (selectedImages.size === 1) {
      // Download single image
      const imageId = Array.from(selectedImages)[0];
      const image = images.find(img => img.id === imageId);
      if (image) {
        downloadSingleImage(image);
      }
    } else {
      // Download multiple images as zip
      await downloadImagesAsZip(images.filter(img => selectedImages.has(img.id)));
    }
  };

  const downloadSingleImage = (image: CapturedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    const filename = `capture_${image.mode}_RA${image.ra.toFixed(2)}_Dec${image.dec.toFixed(2)}_${image.timestamp.getTime()}.jpg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImagesAsZip = async (imagesToDownload: CapturedImage[]) => {
    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each image to the zip
      for (const image of imagesToDownload) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const filename = `capture_${image.mode}_RA${image.ra.toFixed(2)}_Dec${image.dec.toFixed(2)}_${image.timestamp.getTime()}.jpg`;
        zip.file(filename, blob);
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download zip
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `telescope_captures_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content image-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Captured Images</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {images.length === 0 ? (
            <p className="no-images-message">No images captured yet</p>
          ) : (
            <div className="image-gallery-grid">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`gallery-image-card ${selectedImages.has(image.id) ? 'selected' : ''}`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  {selectedImages.has(image.id) && (
                    <div className="selection-indicator">
                      <Check size={24} />
                    </div>
                  )}
                  <img src={image.url} alt={`Captured at RA: ${image.ra.toFixed(2)}, Dec: ${image.dec.toFixed(2)}`} />
                  <div className="image-info">
                    <div className="image-coordinates">
                      RA: {image.ra.toFixed(4)}°, Dec: {image.dec.toFixed(4)}°
                    </div>
                    <div className="image-metadata">
                      <span className="image-mode">{image.mode}</span>
                      <span className="image-timestamp">
                        {image.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedImages.size > 0 && (
          <div className="modal-footer">
            <button className="download-btn" onClick={handleDownload}>
              <Download size={18} />
              Download {selectedImages.size > 1 ? `(${selectedImages.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export type { CapturedImage };
