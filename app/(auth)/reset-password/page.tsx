import type { Metadata } from 'next';
import { RequestResetForm } from '@/features/auth/RequestResetForm';

export const metadata: Metadata = {
  title: 'Reset your password — PortionPair',
};

export default function ResetPasswordPage() {
  return <RequestResetForm />;
}
