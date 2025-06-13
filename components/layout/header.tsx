'use client';

import { PageType } from '@/app/page';

interface HeaderProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const navItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard' },
    { id: 'marketplace' as PageType, label: 'Marketplace' },
    { id: 'learning' as PageType, label: 'Learning' },
    { id: 'community' as PageType, label: 'Community' },
  ];

  return (
    <header className="nexus-header">
      <h1>NexusWorks</h1>
      <nav className="nexus-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(item.id);
                }}
                className={currentPage === item.id ? 'active' : ''}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/project-management" className="text-purple-400 hover:text-purple-300">
              Project Manager
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}