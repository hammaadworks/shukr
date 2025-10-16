import React from 'react';
import { Eraser, Brain } from 'lucide-react';

interface DoodleToolbarProps {
  onClear: () => void;
  onTrain: () => void;
  isUrdu: boolean;
}

export const DoodleToolbar: React.FC<DoodleToolbarProps> = ({ 
  onClear, 
  onTrain, 
  isUrdu 
}) => {
  return (
    <div className="drawing-toolbar">
      <button className="footer-btn secondary" onClick={onClear}>
        <Eraser size={24} />
        <span className={isUrdu ? 'naani-urdu-text' : ''}>{isUrdu ? 'صاف کریں' : 'Clear'}</span>
      </button>
      <button className="footer-btn primary" onClick={onTrain}>
        <Brain size={24} />
        <span className={isUrdu ? 'naani-urdu-text' : ''}>{isUrdu ? 'سکھائیں' : 'Train'}</span>
      </button>
    </div>
  );
};
