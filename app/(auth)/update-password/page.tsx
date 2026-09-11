import type { Metadata } from 'next';
import { UpdatePasswordForm } from '@/features/auth/UpdatePasswordForm';

export const metadata: Metadata = {
  title: 'Choose a new password — PortionPair',
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
