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
  fist: 'SELECT',
  mouth_open: 'SELECT',
  one_finger: 'NEXT',
  two_fingers: 'PREV',
  thumb_up: 'YES',
  palm: 'CLEAR'
};
