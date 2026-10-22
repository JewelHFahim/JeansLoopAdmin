'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Tag,
  SlidersHorizontal,
  Layers,
  Settings,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const userPermissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];

  const allNavLinks = [
    { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'dashboard' },
    { href: '/dashboard/products', label: 'Products', icon: Package, permission: 'products' },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, permission: 'orders' },
    { href: '/dashboard/users', label: 'Users & Staff', icon: Users, permission: 'users', adminOnly: true },
    { href: '/dashboard/settings/categories', label: 'Categories', icon: Layers, permission: 'categories' },
    { href: '/dashboard/settings/coupons', label: 'Coupons', icon: Tag, permission: 'coupons' },
    { href: '/dashboard/sliders', label: 'Hero Sliders', icon: SlidersHorizontal, permission: 'sliders' },
    { href: '/dashboard/settings/site', label: 'Site Settings', icon: Settings, permission: 'settings' },
  ];

  // Filter links for secondary staff/manager roles
  const navLinks = allNavLinks.filter((link) => {
    if (isAdmin) return true;
    if (link.adminOnly) return false;
    return userPermissions.includes(link.permission) || userPermissions.includes('*');
  });

  // Verify access to active route
  const currentLink = allNavLinks.find(
    (l) => pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href))
  );

  const isAccessDenied =
    !isAdmin &&
    currentLink &&
    (currentLink.adminOnly ||
      (!userPermissions.includes(currentLink.permission) && !userPermissions.includes('*')));

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

  // Dedicated clean view for invoice printing (strips all admin navigation and sidebars)
  if (pathname?.includes('/invoice')) {
    return (
      <div className="min-h-screen bg-neutral-100 print:bg-white print:m-0 print:p-0">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden print:h-auto print:overflow-visible">
      {/* Mobile Header */}
      <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 h-16 border-b-4 border-black bg-white flex items-center justify-between px-4 z-40">
        <h1 className="text-xl font-black uppercase italic tracking-tighter">JeansLoop / Admin</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 border-2 border-black"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-black text-white border-r-4 border-black flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b-2 border-neutral-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              JeansLoop
            </h1>
            <span
              className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                isAdmin
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}
            >
              {isAdmin ? 'ADMIN' : 'STAFF'}
            </span>
          </div>
          <p className="text-[10px] font-mono text-neutral-400 truncate mt-1.5">{user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors border-2 ${
                  isActive
                    ? 'border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]'
                    : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-neutral-800 space-y-2">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            <span>View Storefront</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 border-neutral-700 bg-transparent text-neutral-300 hover:bg-red-600 hover:text-white hover:border-red-600 text-[10px]"
          >
            <LogOut className="h-3.5 w-3.5" /> Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 p-6 md:p-10 bg-neutral-50 print:p-0 print:m-0 print:bg-white print:overflow-visible">
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
          {isAccessDenied ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg mx-auto my-12">
              <ShieldAlert className="w-12 h-12 text-red-600 mb-3" />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Access Restricted</h2>
              <p className="text-xs text-neutral-600 mt-2">
                Your role (<strong>{user.role}</strong>) does not have permission to access the{' '}
                <strong>{currentLink?.label || 'requested'}</strong> module.
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Please ask the primary store administrator to grant permission for your account.
              </p>
              {navLinks.length > 0 && (
                <Link href={navLinks[0].href} className="mt-6">
                  <Button size="sm">Go to {navLinks[0].label}</Button>
                </Link>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
