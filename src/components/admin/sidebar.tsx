'use client';

import { Button } from '@/components/ui/button';
import { LayoutDashboard, HelpCircle, Users, Monitor, Languages, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle, path: '/admin/questions' },
    { id: 'staff', label: 'Staff', icon: Users, path: '/admin/staff' },
    { id: 'kiosks', label: 'Kiosks', icon: Monitor, path: '/admin/kiosks' },
    { id: 'languages', label: 'Languages', icon: Languages, path: '/admin/languages' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">MediKiosk</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="outline"
          onClick={onLogout}
          className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
