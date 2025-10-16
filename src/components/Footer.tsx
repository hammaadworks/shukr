import React from 'react';
import { WordCard } from './WordCard';
import { 
  Heart, 
  Users, 
  Pencil
} from 'lucide-react';

interface FooterProps {
  categories: any[];
  currentCategory: string | null;
  onCategoryClick: (catId: string) => void;
  onDoodleClick: () => void;
  onYesClick: () => void;
  onNoClick: () => void;
  focusedIndex: number;
  offset: number;
}

/**
 * Footer - Optimized Dock
 * Matches shukr_shots/bottomdock.png
 * Layout: [Favorite] [Family] [Draw (Center)] [Yes] [No]
 */
export const Footer: React.FC<FooterProps> = ({
  onCategoryClick,
  onDoodleClick,
  onYesClick,
  onNoClick,
  focusedIndex,
  offset,
}) => {
  return (
    <div className="bottom-system-area">
      <div className="integrated-smart-bar central-dock brand-dock-style">
        {/* Left: Collections */}
        <div className="dock-section dock-left">
          <button 
            className={`bar-category-btn ${focusedIndex === offset ? 'focused-item' : ''}`}
            onClick={() => onCategoryClick('favorites')}
          >
            <Heart size={24} />
            <span className="dock-label">پسندیدہ</span>
          </button>

          <button 
            className={`bar-category-btn ${focusedIndex === offset + 1 ? 'focused-item' : ''}`}
            onClick={() => onCategoryClick('family')}
          >
            <Users size={24} />
            <span className="dock-label">خاندان</span>
          </button>
        </div>

        {/* Center: Action */}
        <div className="dock-section dock-center">
          <div className="doodle-btn-wrapper">
            <button 
              className={`big-round-doodle-btn ${focusedIndex === offset + 2 ? 'focused-item' : ''}`}
              onClick={onDoodleClick}
              aria-label="Draw"
            >
              <Pencil size={28} color="white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Right: Quick Affirmations */}
        <div className="dock-section dock-right">
          <div className="footer-quick-actions">
            <WordCard
              variant={2}
              item={{ id: 'sys_yes', ur: 'ہاں', en: 'Yes' }}
              isFocused={focusedIndex === offset + 3}
              onClick={onYesClick}
              className="yes-btn footer-mini-card"
            />
            <WordCard
              variant={2}
              item={{ id: 'sys_no', ur: 'نہیں', en: 'No' }}
              isFocused={focusedIndex === offset + 4}
              onClick={onNoClick}
              className="no-btn footer-mini-card"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
