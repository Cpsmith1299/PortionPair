import type { Metadata } from 'next';
import { SignOutButton } from '@/features/auth/SignOutButton';
import { WeekScreen } from '@/features/week/WeekScreen';

export const metadata: Metadata = {
  title: 'This week’s plan — PortionPair',
};

export default function WeekPage() {
  return (
    <>
      <SignOutButton />
      <WeekScreen />
    </>
  );
}
