import './ImageGalleryModal.css';
import { X } from 'lucide-react';

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
  if (!isOpen) return null;

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
                <div key={image.id} className="gallery-image-card">
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
      </div>
    </div>
  );
}

export type { CapturedImage };
