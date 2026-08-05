import type { ProfileColor } from '@/domain/households/types';
import './ui.css';

interface AvatarProps {
  name: string;
  profileColor: ProfileColor;
  size?: 'small' | 'medium';
}

/**
 * Decorative initial badge. The member's name is always rendered as real text
 * beside it, so this is hidden from assistive technology rather than duplicating
 * the label — and portion differences never rely on color alone (CLAUDE.md §11).
 */
export function Avatar({ name, profileColor, size = 'medium' }: AvatarProps) {
  return (
    <span className={`avatar avatar--${profileColor} avatar--${size}`} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}
