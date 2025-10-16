'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, FileText, LogOut, Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/customers', icon: Users, label: 'Customers' },
    { href: '/visit-plans', icon: CalendarCheck, label: 'Visit Plans' },
    { href: '/visit-reports', icon: FileText, label: 'Visit Reports' },
  ];

  // Admin-only menu
  if (user?.role === 'ADMIN') {
    menuItems.push({ href: '/users', icon: Settings, label: 'User Management' });
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">VP</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Visit Plan</h1>
            <p className="text-xs text-gray-500">Telkom Indonesia</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 px-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {user?.namaLengkap?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.namaLengkap || 'User'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'USER'}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
