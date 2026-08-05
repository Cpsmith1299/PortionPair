import type { Metadata } from 'next';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export const metadata: Metadata = {
  title: 'Plan setup — PortionPair',
};

export default function OnboardingPage() {
  return <OnboardingScreen />;
}
