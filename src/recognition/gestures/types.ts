export type GestureAction = 
  | 'NEXT' 
  | 'PREV' 
  | 'SELECT' 
  | 'CLEAR' 
  | 'ATTENTION' 
  | 'DOODLE' 
  | 'SPEAK' 
  | 'HOME' 
  | 'YES' 
  | 'SALAM' 
  | 'CALL_CONTACT_1' 
  | 'TOGGLE_RECOGNITION';

export interface GestureMapping {
  gesture: string;
  action: GestureAction;
}

export const FIXED_GESTURE_MAP: Record<string, GestureAction> = {
  mouth_open: 'SPEAK',
  fist: 'SELECT',
  thumb_up: 'YES',
  peace_sign: 'SALAM',
  one_finger: 'NEXT',
  two_fingers: 'PREV',
  three_fingers: 'DOODLE',
  palm: 'CLEAR'
};
