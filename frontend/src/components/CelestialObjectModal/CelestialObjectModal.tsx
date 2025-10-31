import './CelestialObjectModal.css';
import { X, Navigation } from 'lucide-react';
import type { AstronomicalObject } from '@/types/objectList.types';
import { useTelescopeContext } from '@/contexts/TelescopeContext';

interface CelestialObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: AstronomicalObject | null;
}

export default function CelestialObjectModal({ isOpen, onClose, object }: CelestialObjectModalProps) {
  const { gotoCoordinates, toggleTracking, isTracking } = useTelescopeContext();

  if (!isOpen || !object) return null;

  const handleTrack = () => {
    // Slew to the object
    gotoCoordinates(object.ra, object.dec);

    // Enable tracking if not already enabled
    if (!isTracking) {
      toggleTracking();
    }

    // Close the modal
    onClose();
  };

  const formatCoordinate = (value: number, type: 'ra' | 'dec') => {
    if (type === 'ra') {
      // Convert RA from degrees to hours
      const hours = value / 15;
      const h = Math.floor(hours);
      const minutes = (hours - h) * 60;
      const m = Math.floor(minutes);
      const s = ((minutes - m) * 60).toFixed(1);
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.padStart(4, '0')}s`;
    } else {
      // Format Dec
      const sign = value >= 0 ? '+' : '-';
      const absValue = Math.abs(value);
      const d = Math.floor(absValue);
      const minutes = (absValue - d) * 60;
      const m = Math.floor(minutes);
      const s = ((minutes - m) * 60).toFixed(1);
      return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.padStart(4, '0')}"`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content celestial-object-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{object.name}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="object-details">
            <div className="detail-row">
              <span className="detail-label">Object Type:</span>
              <span className="detail-value">{object.object_type || 'Unknown'}</span>
            </div>

            <div className="detail-section">
              <h3>Coordinates</h3>
              <div className="detail-row">
                <span className="detail-label">Right Ascension:</span>
                <span className="detail-value">{formatCoordinate(object.ra, 'ra')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Declination:</span>
                <span className="detail-value">{formatCoordinate(object.dec, 'dec')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">RA (degrees):</span>
                <span className="detail-value">{object.ra.toFixed(4)}°</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Dec (degrees):</span>
                <span className="detail-value">{object.dec.toFixed(4)}°</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Observation Data</h3>
              {object.magnitude !== null && object.magnitude !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Magnitude:</span>
                  <span className="detail-value">{object.magnitude.toFixed(2)}</span>
                </div>
              )}
              {object.altitude !== undefined && object.altitude !== null && (
                <div className="detail-row">
                  <span className="detail-label">Altitude:</span>
                  <span className="detail-value">{object.altitude.toFixed(2)}°</span>
                </div>
              )}
              {object.azimuth !== undefined && object.azimuth !== null && (
                <div className="detail-row">
                  <span className="detail-label">Azimuth:</span>
                  <span className="detail-value">{object.azimuth.toFixed(2)}°</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button className="track-btn" onClick={handleTrack}>
              <Navigation size={18} />
              Track Object
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
