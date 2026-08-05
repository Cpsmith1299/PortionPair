'use client';

import type { ReactNode } from 'react';
import './week.css';

/**
 * Approved authenticated navigation (CLAUDE.md §10). Only Week exists in slice
 * one; the rest are rendered as disabled so the shell is honest about what is
 * built rather than offering dead links.
 */
interface NavItem {
  label: string;
  icon: ReactNode;
  active: boolean;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21S4 16.5 2 11.5C.8 8.5 2.8 5 6.2 5c2.2 0 3.7 1.2 4.8 2.8C12 6.2 13.7 5 15.8 5c3.4 0 5.4 3.5 4.2 6.5C18 16.5 12 21 12 21Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Week', icon: <CalendarIcon />, active: true },
  { label: 'Grocery', icon: <CartIcon />, active: false },
  { label: 'Favorites', icon: <HeartIcon />, active: false },
  { label: 'Profile', icon: <UserIcon />, active: false },
];

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? 'mobile-nav' : 'desktop-nav'} aria-label={mobile ? 'Primary, mobile' : 'Primary'}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          aria-current={item.active ? 'page' : undefined}
          disabled={!item.active}
          aria-label={item.active ? item.label : `${item.label}, coming soon`}
        >
          {mobile && <span className="nav-icon">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
