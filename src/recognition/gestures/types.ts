export type GestureAction = 
  | 'NEXT' 
  | 'SELECT' 
  | 'CLEAR' 
  | 'YES';

export type GestureMappingType = 'action' | 'words' | 'audio';

export interface GestureDefinition {
  id: string; 
  type: GestureMappingType;
  value: string | string[]; 
  label_primary?: string;
  label_secondary?: string;
  label_en: string; // Keep for fallback
  label_ur: string; // Keep for fallback
}

export const DEFAULT_GESTURE_MAP: Record<string, GestureDefinition> = {
  mouth_open: {
    id: 'mouth_open',
    type: 'action',
    value: 'SELECT',
    label_en: 'Select',
    label_ur: 'منتخب کریں'
  },
  one_finger: {
    id: 'one_finger',
    type: 'action',
    value: 'NEXT',
    label_en: 'Next',
    label_ur: 'اگلا'
  },
  palm: {
    id: 'palm',
    type: 'action',
    value: 'CLEAR',
    label_en: 'Clear',
    label_ur: 'صاف کریں'
  },
  fist: {
    id: 'fist',
    type: 'action',
    value: 'YES',
    label_en: 'Yes',
    label_ur: 'ہاں'
  }
};
