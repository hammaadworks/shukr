import React from 'react';
import { Eraser, Waves } from 'lucide-react';

interface DoodleToolbarProps {
  onClear: () => void;
  onTrain: () => void;
  isPrimary: boolean;
}

export const DoodleToolbar: React.FC<DoodleToolbarProps> = ({ 
  onClear, 
  onTrain, 
  isPrimary 
}) => {
  return (
    <div className="drawing-toolbar">
      <button className="footer-btn secondary" onClick={onClear}>
        <Eraser size={24} />
        <span className={isPrimary ? 'naani-urdu-text' : ''}>{isPrimary ? 'صاف کریں' : 'Clear'}</span>
      </button>
      <button className="footer-btn primary" onClick={onTrain}>
        <Waves size={24} />
        <span className={isPrimary ? 'naani-urdu-text' : ''}>{isPrimary ? 'سکھائیں' : 'Train'}</span>
      </button>
    </div>
  );
};
