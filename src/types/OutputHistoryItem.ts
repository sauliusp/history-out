import { TransitionType } from './TransitionType';

export interface OutputHistoryItem {
  order: number;
  id: string;
  date: string;
  time: string;
  title: string;
  url: string;
  visitCount: number;
  typedCount: number;
  transition: TransitionType;
}
