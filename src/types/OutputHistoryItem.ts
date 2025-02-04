import { TransitionType } from './TransitionType';

export interface OutputHistoryItem {
  order?: number;
  id?: string;
  isWebUrl?: boolean;
  referringVisitId?: string;
  transition?: TransitionType;
  transitionLabel?: string;
  visitId?: string;
  visitTime?: number;
  visitTimeFormatted?: string;
  title?: string;
  lastVisitTime?: number;
  lastVisitTimeFormatted?: string;
  typedCount?: number;
  url?: string;
  visitCount?: number;
}
