import React from 'react';
import {WordCard} from './WordCard';
import {Heart, PenTool, Users} from 'lucide-react';

interface FooterProps {
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
export const Footer: React.FC<FooterProps> = React.memo(({
    onCategoryClick,
    onDoodleClick,
    onYesClick,
    onNoClick,
    focusedIndex,
    offset,
    currentCategory,
}) => {
    return (
        <div className="bottom-system-area" dir="ltr">
            <div className="integrated-smart-bar central-dock brand-dock-style">
                {/* 1: Yes */}
                <WordCard
                    variant={4}
                    item={{ id: 'sys_yes', ur: 'ہاں', en: 'Yes' }}
                    isFocused={focusedIndex === offset}
                    onClick={onYesClick}
                    className="yes-btn footer-mini-card"
                />

                {/* 2: No */}
                <WordCard
                    variant={4}
                    item={{ id: 'sys_no', ur: 'نہیں', en: 'No' }}
                    isFocused={focusedIndex === offset + 1}
                    onClick={onNoClick}
                    className="no-btn footer-mini-card"
                />

                {/* 3: Center Action (Doodle) */}
                <div className="doodle-btn-wrapper">
                    <button
                        className={`big-round-doodle-btn ${focusedIndex === offset + 2 ? 'focused-item' : ''}`}
                        onClick={onDoodleClick}
                        aria-label="Draw"
                    >
                        <PenTool size={28} color="white" strokeWidth={2.5}/>
                    </button>
                </div>

                {/* 4: Favorite */}
                <button
                    className={`bar-category-btn favorite-btn ${focusedIndex === offset + 3 ? 'focused-item' : ''} ${currentCategory === 'favorite' ? 'active-category' : ''}`}
                    onClick={() => onCategoryClick('favorite')}
                >
                    <Heart size={24} fill="var(--color-danger)"/>
                    <span className="dock-label">پسندیدہ</span>
                </button>

                {/* 5: Family */}
                <button
                    className={`bar-category-btn family-btn ${focusedIndex === offset + 4 ? 'focused-item' : ''} ${currentCategory === 'family' ? 'active-category' : ''}`}
                    onClick={() => onCategoryClick('family')}
                >
                    <Users size={24} fill="var(--color-primary)"/>
                    <span className="dock-label">خاندان</span>
                </button>
            </div>
        </div>
    );
});
