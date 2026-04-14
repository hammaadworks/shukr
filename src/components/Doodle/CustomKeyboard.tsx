import React, { useMemo } from 'react';
import { Delete, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}

const layouts: Record<string, string[][]> = {
  en: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  es: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  ur: [
    ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰'],
    ['ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ'],
    ['د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص'],
    ['ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل'],
    ['م', 'ن', 'و', 'ہ', 'ھ', 'ء', 'ی', 'ے']
  ],
  ar: [
    ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
    ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر'],
    ['ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف'],
    ['ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي']
  ]
};

export const CustomKeyboard: React.FC<CustomKeyboardProps> = ({ onKeyPress, onBackspace, onClose }) => {
  const { language } = useLanguage();
  
  const layout = useMemo(() => {
    // Fallback to English layout if language isn't explicitly supported
    return layouts[language] || layouts['en'];
  }, [language]);

  const handleKeyClick = (e: React.MouseEvent | React.TouchEvent, key: string) => {
    e.preventDefault();
    onKeyPress(key);
  };

  const handleBackspace = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onBackspace();
  };

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="custom-keyboard-container">
      <div className="keyboard-header">
        <button className="keyboard-close-btn" onClick={handleClose} onTouchEnd={handleClose}>
          <ChevronDown size={24} />
        </button>
      </div>
      <div className="keyboard-keys" dir={['ur', 'ar'].includes(language) ? 'rtl' : 'ltr'}>
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => (
              <button
                key={key}
                className="keyboard-key"
                onClick={(e) => handleKeyClick(e, key)}
                onTouchEnd={(e) => handleKeyClick(e, key)}
              >
                {key}
              </button>
            ))}
            {/* Add Backspace at the end of the last row */}
            {rowIndex === layout.length - 1 && (
              <button
                className="keyboard-key backspace-key"
                onClick={handleBackspace}
                onTouchEnd={handleBackspace}
              >
                <Delete size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
