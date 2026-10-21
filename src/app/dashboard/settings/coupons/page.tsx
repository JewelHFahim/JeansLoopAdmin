'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon } from '@/lib/api-types';

export default function CouponsSettingsPage() {
  const queryClient = useQueryClient();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    minAmount: 1000,
    expiryDate: '',
    isActive: true,
  });

  const { data: couponsRes, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await couponsApi.getAll();
      return res.data.data;
    },
  });

  const coupons = couponsRes || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => couponsApi.create(data),
    onSuccess: () => {
      toast.success('Coupon created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setIsCreating(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => couponsApi.update(id, data),
    onSuccess: () => {
      toast.success('Coupon updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setEditingCoupon(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => {
      toast.success('Coupon removed');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete coupon'),
  });

  const handleStartEdit = (cp: Coupon) => {
    setEditingCoupon(cp);
    setIsCreating(false);
    setForm({
      code: cp.code,
      type: cp.type,
      value: cp.value,
      minAmount: cp.minAmount,
      expiryDate: cp.expiryDate ? new Date(cp.expiryDate).toISOString().slice(0, 10) : '',
      isActive: cp.isActive,
    });
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCoupon(null);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setForm({
      code: '',
      type: 'percentage',
      value: 10,
      minAmount: 1000,
      expiryDate: in30Days,
      isActive: true,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-black pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
            Discount Engine
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Coupon Protocols
          </h1>
        </div>

        {!isCreating && !editingCoupon && (
          <Button size="sm" onClick={handleStartCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        )}
      </div>

      {/* Form */}
      {(isCreating || editingCoupon) && (
        <form
          onSubmit={handleSave}
          className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in"
        >
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest">
              {editingCoupon ? `Edit: ${editingCoupon.code}` : 'Generate Promo Coupon'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCoupon(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Promo Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER25"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Discount Type *</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                className="flex h-12 w-full border-2 border-black bg-white px-4 text-xs font-bold uppercase"
              >
                <option value="percentage">Percentage Off (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Discount Value *</Label>
              <Input
                type="number"
                min="1"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Minimum Order (৳)</Label>
              <Input
                type="number"
                min="0"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label>Expiration Date *</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1 flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black uppercase">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 border-2 border-black rounded-none"
                />
                <span>Active Status</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase text-[10px] font-black tracking-wider">
              <th className="p-4 border-r border-neutral-700">Code</th>
              <th className="p-4 border-r border-neutral-700">Type & Value</th>
              <th className="p-4 border-r border-neutral-700">Min Order</th>
              <th className="p-4 border-r border-neutral-700">Expiry Date</th>
              <th className="p-4 border-r border-neutral-700">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No coupons found.
                </td>
              </tr>
            ) : (
              coupons.map((cp) => (
                <tr key={cp._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 border-r border-neutral-200 font-mono font-black text-sm uppercase text-black">
                    {cp.code}
                  </td>
                  <td className="p-4 border-r border-neutral-200 font-black">
                    {cp.type === 'percentage' ? `${cp.value}% OFF` : `৳${cp.value} OFF`}
                  </td>
                  <td className="p-4 border-r border-neutral-200 text-neutral-600">
                    {formatPrice(cp.minAmount)}
                  </td>
                  <td className="p-4 border-r border-neutral-200 font-mono text-[11px]">
                    {new Date(cp.expiryDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-4 border-r border-neutral-200">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase ${
                        cp.isActive && new Date(cp.expiryDate) > new Date()
                          ? 'bg-black text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {cp.isActive && new Date(cp.expiryDate) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStartEdit(cp)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteTarget(cp)}
                        className="h-8 w-8"
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Revoke Coupon"
        description={`Are you sure you want to permanently delete coupon "${deleteTarget?.code}"?`}
        confirmLabel="Delete Coupon"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
