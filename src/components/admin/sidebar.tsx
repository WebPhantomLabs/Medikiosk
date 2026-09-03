'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, HelpCircle, Users, Monitor, Languages, LogOut, Menu, X, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle, path: '/admin/questions' },
    { id: 'staff', label: 'Staff', icon: Users, path: '/admin/staff' },
    { id: 'kiosks', label: 'Kiosks', icon: Monitor, path: '/admin/kiosks' },
    { id: 'languages', label: 'Languages', icon: Languages, path: '/admin/languages' },
  ];

  const sidebarContent = (
    <div 
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--mk-surface-elevated)', color: 'var(--mk-text)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--mk-border)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl"
            style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
          >
            M
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--mk-text)' }}>MediKiosk</h1>
            <p className="text-xs font-medium" style={{ color: 'var(--mk-text-secondary)' }}>Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-primary)]"
              style={{
                backgroundColor: isActive ? 'var(--mk-primary-subtle)' : 'transparent',
                color: isActive ? 'var(--mk-primary-dark)' : 'var(--mk-text-secondary)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? 'var(--mk-primary)' : 'inherit' }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area: Health + Logout */}
      <div className="p-4 border-t space-y-4" style={{ borderColor: 'var(--mk-border)' }}>
        
        {/* System Health */}
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--mk-success)' }}></span>
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: 'var(--mk-success)' }}></span>
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--mk-text-secondary)' }}>
            All systems operational
          </span>
        </div>

        <Button
          variant="outline"
          onClick={onLogout}
          className="w-full justify-start border"
          style={{ 
            borderColor: 'var(--mk-border-strong)', 
            color: 'var(--mk-text)' 
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out border-r
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{ borderColor: 'var(--mk-border)' }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
