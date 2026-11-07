'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, ShoppingCart, Package, Users, Plus, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PIE_COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5'];

export default function DashboardOverviewPage() {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await statsApi.getDashboard();
      return res.data.data;
    },
  });

  const stats = statsRes;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Net Revenue',
      value: formatPrice(stats?.totalSales || 0),
      subtitle: 'From active/fulfilled orders',
      icon: DollarSign,
    },
    {
      title: 'Lifetime Orders',
      value: (stats?.totalOrders || 0).toLocaleString(),
      subtitle: 'Total recorded orders',
      icon: ShoppingCart,
    },
    {
      title: 'Catalog Items',
      value: (stats?.totalProducts || 0).toLocaleString(),
      subtitle: 'Published products',
      icon: Package,
    },
    {
      title: 'Customer Accounts',
      value: (stats?.totalUsers || 0).toLocaleString(),
      subtitle: 'Registered shoppers',
      icon: Users,
    },
  ];

  const chartData = (stats?.salesHistory || []).map((item) => ({
    date: item._id.slice(5),
    sales: item.totalSales,
    orders: item.orderCount,
  }));

  const pieData = (stats?.orderStatusDistribution || []).map((item) => ({
    name: item._id,
    value: item.count,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-3 sm:pb-4 gap-3">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 block mb-0.5">
            System Operational
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic tracking-tight text-black leading-none">
            Command Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/dashboard/products/new" className="flex-1 sm:flex-initial">
            <Button size="sm" className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
          <Link href="/dashboard/orders" className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
              View Orders <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards - 2 cols on mobile for compact overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="p-3.5 sm:p-6 space-y-1 sm:space-y-2">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-neutral-400 line-clamp-1">
                  {card.title}
                </span>
                <div className="p-1 sm:p-2 border border-black sm:border-2 bg-neutral-100 shrink-0">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-black tracking-tight">{card.value}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-neutral-500 uppercase truncate">{card.subtitle}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Sales Timeline */}
        <div className="lg:col-span-2 border-2 border-black p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="border-b-2 border-black pb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest">
              30-Day Revenue Trend (BDT)
            </h2>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 sm:h-64 flex items-center justify-center text-xs text-neutral-400 font-bold uppercase">
              No sales data recorded in the last 30 days
            </div>
          ) : (
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#000000" fontSize={10} tickLine={false} />
                  <YAxis stroke="#000000" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000000',
                      border: '2px solid #000000',
                      color: '#ffffff',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="sales" fill="#000000" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="border-2 border-black p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="border-b-2 border-black pb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest">Order Status Registry</h2>
          </div>

          {pieData.length === 0 ? (
            <div className="h-56 sm:h-64 flex items-center justify-center text-xs text-neutral-400 font-bold uppercase">
              No orders found
            </div>
          ) : (
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={9}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
