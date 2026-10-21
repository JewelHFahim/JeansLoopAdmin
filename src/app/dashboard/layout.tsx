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

  const navLinks = [
    { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/settings/categories', label: 'Categories', icon: Layers },
    { href: '/dashboard/settings/coupons', label: 'Coupons', icon: Tag },
    { href: '/dashboard/sliders', label: 'Hero Sliders', icon: SlidersHorizontal },
    { href: '/dashboard/settings/site', label: 'Site Settings', icon: Settings },
  ];

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b-4 border-black bg-white flex items-center justify-between px-4 z-40">
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white border-r-4 border-black flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b-2 border-neutral-800">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            JeansLoop
          </h1>
          <p className="text-[10px] font-mono text-neutral-400 truncate mt-1">{user.email}</p>
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
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 p-6 md:p-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
