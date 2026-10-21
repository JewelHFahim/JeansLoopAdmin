'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Eye, FileText, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/lib/api-types';

const STATUSES = ['PENDING', 'ACCEPTED', 'COURIERED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'EXCHANGE'] as const;

export default function OrdersListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-orders', page, keyword, statusFilter],
    queryFn: async () => {
      const res = await ordersApi.getAll({
        page,
        limit: 10,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      return res.data;
    },
  });

  const orders = response?.data || [];
  const pagination = response?.pagination;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      toast.success('Order deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-black pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
            Transaction Registry
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Orders Console
          </h1>
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 border-2 border-black bg-white px-3 text-[10px] font-black uppercase tracking-wider outline-none"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <SearchInput
          placeholder="SEARCH BY CUSTOMER NAME, PHONE, CITY, OR TRXID..."
          onDebouncedChange={(val) => {
            setKeyword(val);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Table */}
      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase text-[10px] font-black tracking-wider">
              <th className="p-4 border-r border-neutral-700">Order ID & Date</th>
              <th className="p-4 border-r border-neutral-700">Customer & District</th>
              <th className="p-4 border-r border-neutral-700">Items & Total</th>
              <th className="p-4 border-r border-neutral-700">Payment</th>
              <th className="p-4 border-r border-neutral-700">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-mono font-black uppercase text-black">
                      #{o._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-normal">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-black uppercase text-black">{o.shippingAddress.fullName}</p>
                    <p className="text-[10px] text-neutral-400">
                      {o.shippingAddress.phone} / {o.shippingAddress.city}
                    </p>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-black text-black">{formatPrice(o.totalAmount)}</p>
                    <p className="text-[10px] text-neutral-400">
                      {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <span className="text-[10px] font-black uppercase block">
                      {o.paymentMethod.toUpperCase()}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[8px] font-black uppercase ${
                        o.isPaid ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {o.isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({ id: o._id, status: e.target.value })
                      }
                      className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase outline-none cursor-pointer"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/orders/${o._id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Inspect">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/orders/${o._id}/invoice`}>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Print Invoice">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteTarget(o)}
                        className="h-8 w-8"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Total {pagination.total} orders recorded
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Order Record"
        description={`Are you sure you want to delete order #${deleteTarget?._id.slice(-6).toUpperCase()}? This action cannot be undone.`}
        confirmLabel="Delete Order"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
