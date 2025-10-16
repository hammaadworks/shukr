import React from 'react';
import { Folder } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';

interface CategorySliderProps {
  categories: any[];
  currentCategory: string | null;
  onCategoryClick: (catId: string) => void;
  focusedIndex: number;
  offset: number;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  currentCategory,
  onCategoryClick,
  focusedIndex,
  offset,
}) => {
  useLanguage();

  return (
    <div className="naani-action-blocks">
      {categories.slice(0, 3).map((cat, idx) => {
        const cIdx = offset + idx;
        const Icon = IconMap[cat.icon] || Folder;
        return (
          <button
            key={cat.id}
            className={`action-block-apple ${
              currentCategory === cat.id ? 'active' : ''
            } ${focusedIndex === cIdx ? 'focused-item' : ''}`}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(60);
              onCategoryClick(cat.id);
            }}
          >
            <div className="action-icon-wrap">
              <Icon size={32} />
            </div>
            <div className="action-text-wrap">
               <span className="action-ur">{cat.label_ur}</span>
               <span className="action-en">{cat.label_en}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
