'use client';

import { use } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Printer, CheckCircle, Truck, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['PENDING', 'ACCEPTED', 'COURIERED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'EXCHANGE'] as const;

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await ordersApi.getById(id);
      return response.data;
    },
  });

  const order = res?.data;

  const [editAddress, setEditAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const payMutation = useMutation({
    mutationFn: () => ordersApi.markAsPaid(id),
    onSuccess: () => {
      toast.success('Order marked as paid');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: () => ordersApi.markAsDelivered(id),
    onSuccess: () => {
      toast.success('Order marked as delivered');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: (data: any) => ordersApi.updateDetails(id, data),
    onSuccess: () => {
      toast.success('Order details updated');
      setEditAddress(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update details');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 border-2 border-black bg-white text-center space-y-3 max-w-md mx-auto my-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-black uppercase text-sm text-black">Order Not Found</p>
        <p className="text-xs text-neutral-500">
          {(error as any)?.response?.data?.message || 'The requested order could not be loaded.'}
        </p>
        <Link href="/dashboard/orders">
          <Button size="sm" variant="outline" className="mt-2 text-xs uppercase font-bold">
            Back to Orders List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-black leading-none">
                Order #{order._id.slice(-6).toUpperCase()}
              </h1>
              <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase">
                {order.status}
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400 mt-1 select-all">{order._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/orders/${order._id}/invoice`}>
            <Button variant="outline" size="sm" className="gap-2 text-[10px]">
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </Button>
          </Link>

          {!order.isPaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="gap-2 text-[10px]"
            >
              <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Mark Paid
            </Button>
          )}

          {!order.isDelivered && (
            <Button
              size="sm"
              onClick={() => deliverMutation.mutate()}
              disabled={deliverMutation.isPending}
              className="gap-2 text-[10px]"
            >
              <Truck className="h-3.5 w-3.5" /> Mark Delivered
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Order Items & Delivery Address */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Line Items ({order.items.length})
            </h2>

            <div className="border-2 border-black divide-y-2 divide-black">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 bg-white">
                  <div className="relative w-16 h-20 flex-shrink-0 bg-neutral-100 border border-neutral-200">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate text-black">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      SKU: {item.variantSku} / Size: {item.size} / Color: {item.color}
                    </p>
                    <p className="text-xs font-bold text-neutral-600 mt-1">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-black text-black">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h2 className="text-sm font-black uppercase tracking-widest">Delivery Destination</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddressForm({
                    fullName: order.shippingAddress.fullName,
                    phone: order.shippingAddress.phone,
                    street: order.shippingAddress.street,
                    city: order.shippingAddress.city,
                  });
                  setEditAddress(!editAddress);
                }}
                className="text-[10px]"
              >
                {editAddress ? 'Cancel' : 'Edit Address'}
              </Button>
            </div>

            {editAddress ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Recipient Name</Label>
                    <Input
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Phone Number</Label>
                    <Input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">City / District</Label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10px]">Street Address</Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => updateDetailsMutation.mutate({ shippingAddress: addressForm })}
                  disabled={updateDetailsMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-3.5 w-3.5" /> Save Address
                </Button>
              </div>
            ) : (
              <div className="text-xs space-y-1">
                <p className="font-black text-black">{order.shippingAddress.fullName}</p>
                <p className="font-bold text-neutral-600">{order.shippingAddress.phone}</p>
                <p className="font-medium text-neutral-500">
                  {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                  {order.shippingAddress.country}
                </p>
                {order.shippingAddress.note && (
                  <p className="text-[10px] italic text-neutral-400 mt-2">
                    Note: &ldquo;{order.shippingAddress.note}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Status Changer & Financial Summary */}
        <div className="space-y-8">
          {/* Status Control */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Status Progression
            </h2>

            <div className="space-y-2">
              <Label className="text-[10px]">Lifecycle Stage</Label>
              <select
                value={order.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                disabled={statusMutation.isPending}
                className="w-full h-11 border-2 border-black bg-white px-3 text-xs font-black uppercase outline-none cursor-pointer"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            {/* Status Progression Audit Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="border-t-2 border-black pt-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Status History ({order.statusHistory.length})
                </p>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {order.statusHistory.map((historyItem, idx) => {
                    const dt = new Date(historyItem.changedAt);
                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-neutral-50 border border-neutral-200 text-xs space-y-0.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase text-black">
                            {historyItem.status}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {dt.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}{' '}
                            {dt.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-medium">
                          By: {historyItem.changedByName || historyItem.changedBy}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment & Financials */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Financial Breakdown
            </h2>

            <div className="space-y-2 text-xs font-bold uppercase">
              <div className="flex justify-between text-neutral-500">
                <span>Items Subtotal:</span>
                <span>{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Delivery Fee:</span>
                <span>{formatPrice(order.shippingPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.couponCode || 'PROMO'}):</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-black pt-3 border-t-2 border-black">
                <span>Total Amount:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t-2 border-black pt-4 text-xs space-y-1">
              <p className="text-[10px] font-black uppercase text-neutral-400">Payment Protocol</p>
              <p className="font-bold uppercase">
                Method: {order.paymentMethod.toUpperCase()}
              </p>
              {order.bkashNumber && (
                <p className="font-mono text-[11px]">bKash Number: {order.bkashNumber}</p>
              )}
              {order.bkashTxnId && (
                <p className="font-mono text-[11px] select-all">TrxID: {order.bkashTxnId}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
