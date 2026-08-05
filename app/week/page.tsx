import type { Metadata } from 'next';
import { WeekScreen } from '@/features/week/WeekScreen';

export const metadata: Metadata = {
  title: 'This week’s plan — PortionPair',
};

export default function WeekPage() {
  return <WeekScreen />;
}
