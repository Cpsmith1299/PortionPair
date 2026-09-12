'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import './week.css';

/**
 * Approved authenticated navigation (CLAUDE.md §10). Week and Grocery are
 * built; Favorites and Profile are rendered disabled so the shell is honest
 * about what is built rather than offering dead links.
 */
interface NavItem {
  label: string;
  icon: ReactNode;
  // A literal union, not `string` — Next's typed routes need to see the exact
  // route at the `<Link>` call site, not a widened string.
  href?: '/week' | '/grocery';
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
  { label: 'Week', icon: <CalendarIcon />, href: '/week' },
  { label: 'Grocery', icon: <CartIcon />, href: '/grocery' },
  { label: 'Favorites', icon: <HeartIcon /> },
  { label: 'Profile', icon: <UserIcon /> },
];

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? 'mobile-nav' : 'desktop-nav'} aria-label={mobile ? 'Primary, mobile' : 'Primary'}>
      {NAV_ITEMS.map((item) => {
        const active = item.href !== undefined && pathname?.startsWith(item.href);

        if (!item.href) {
          return (
            <button key={item.label} type="button" disabled aria-label={`${item.label}, coming soon`}>
              {mobile && <span className="nav-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link key={item.label} href={item.href} aria-current={active ? 'page' : undefined}>
            {mobile && <span className="nav-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
