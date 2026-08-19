import { Compass, Minus, Plus } from "lucide-react";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const MapControls = ({ onZoomIn, onZoomOut, onReset }: Props) => (
  <div className="map-controls panel" aria-label="Map controls">
    <button type="button" className="map-controls__button" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
      <Plus size={15} />
    </button>
    <button type="button" className="map-controls__button" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
      <Minus size={15} />
    </button>
    <span className="map-controls__divider" aria-hidden />
    <button type="button" className="map-controls__button map-controls__button--home" onClick={onReset} aria-label="Center village" title="Center village">
      <Compass size={15} />
    </button>
  </div>
);
