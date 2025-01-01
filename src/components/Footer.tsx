import React from 'react';
import {WordCard} from './WordCard';
import {Heart, PenTool, Users} from 'lucide-react';

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
                                                  currentCategory,
                                              }) => {
    return (<div className="bottom-system-area">
        <div className="integrated-smart-bar central-dock brand-dock-style">
            {/* 1: Favorite */}
            <button
                className={`bar-category-btn ${focusedIndex === offset ? 'focused-item' : ''} ${currentCategory === 'cat_fav' || currentCategory === 'favorites' ? 'active-category' : ''}`}
                onClick={() => onCategoryClick('cat_fav')}
                style={{gridColumn: 1}}
            >
                <Heart size={24}/>
                <span className="dock-label">پسندیدہ</span>
            </button>

            {/* 2: Family */}
            <button
                className={`bar-category-btn ${focusedIndex === offset + 1 ? 'focused-item' : ''} ${currentCategory === 'khandan' || currentCategory === 'family' ? 'active-category' : ''}`}
                onClick={() => onCategoryClick('khandan')}
                style={{gridColumn: 2}}
            >
                <Users size={24}/>
                <span className="dock-label">خاندان</span>
            </button>

            {/* 3: Center Action (Doodle) */}
            <div className="doodle-btn-wrapper" style={{gridColumn: 3}}>
                <button
                    className={`big-round-doodle-btn ${focusedIndex === offset + 2 ? 'focused-item' : ''}`}
                    onClick={onDoodleClick}
                    aria-label="Draw"
                >
                    <PenTool size={28} color="white" strokeWidth={2.5}/>
                </button>
            </div>

            {/* 4: Yes */}
            <WordCard
                variant={4}
                item={{id: 'sys_yes', ur: 'ہاں', en: 'Yes'}}
                isFocused={focusedIndex === offset + 3}
                onClick={onYesClick}
                className="yes-btn footer-mini-card"
            />

            {/* 5: No */}
            <WordCard
                variant={4}
                item={{id: 'sys_no', ur: 'نہیں', en: 'No'}}
                isFocused={focusedIndex === offset + 4}
                onClick={onNoClick}
                className="no-btn footer-mini-card"
            />
        </div>
    </div>);
};
