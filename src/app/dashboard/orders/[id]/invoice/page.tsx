'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, settingsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: orderRes, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await ordersApi.getById(id);
      return res.data;
    },
  });

  const { data: settingsRes, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await settingsApi.get();
      return res.data;
    },
  });

  const order = orderRes?.data;
  const settings = settingsRes?.data;

  if (isOrderLoading || isSettingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8">Order not found</div>;
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-10 font-mono text-xs">
      <style jsx global>{`
        @media print {
          aside,
          header,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* Action Bar (Hidden on print) */}
      <div className="no-print max-w-3xl mx-auto mb-8 flex justify-between items-center">
        <Link href={`/dashboard/orders/${order._id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Order
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Container */}
      <div className="max-w-3xl mx-auto border-4 border-black p-8 md:p-12 space-y-8 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">
              {settings?.title || 'JeansLoop'}
            </h1>
            <p className="text-[10px] text-neutral-500 uppercase mt-1">
              {settings?.tagline || 'Premium Denim Collection'}
            </p>
            <p className="text-[10px] mt-2">{settings?.address}</p>
            <p className="text-[10px]">Phone: {settings?.phone} | Email: {settings?.email}</p>
          </div>

          <div className="text-right">
            <span className="text-xl font-black uppercase tracking-wider block">INVOICE</span>
            <p className="text-[10px] mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
            <p className="text-[10px] text-neutral-500">
              Date:{' '}
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 border-b-2 border-black pb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">
              Billed & Shipped To:
            </p>
            <p className="font-black text-sm uppercase">{order.shippingAddress.fullName}</p>
            <p className="mt-1">{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">
              Payment Protocol:
            </p>
            <p className="font-black uppercase">{order.paymentMethod.toUpperCase()}</p>
            <p className="uppercase">{order.isPaid ? 'STATUS: PAID' : 'STATUS: UNPAID (COD)'}</p>
            {order.bkashTxnId && (
              <p className="text-[10px] select-all">TrxID: {order.bkashTxnId}</p>
            )}
          </div>
        </div>

        {/* Table of Items */}
        <div className="border-2 border-black">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] font-black">
                <th className="p-3 border-r border-neutral-700">Item Description</th>
                <th className="p-3 border-r border-neutral-700 text-center">Size</th>
                <th className="p-3 border-r border-neutral-700 text-center">Qty</th>
                <th className="p-3 border-r border-neutral-700 text-right">Unit Price</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t border-black">
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td className="p-3 border-r border-neutral-200">
                    <p className="font-black uppercase">{item.name}</p>
                    <p className="text-[9px] text-neutral-400">SKU: {item.variantSku}</p>
                  </td>
                  <td className="p-3 border-r border-neutral-200 text-center font-bold">
                    {item.size}
                  </td>
                  <td className="p-3 border-r border-neutral-200 text-center font-bold">
                    {item.quantity}
                  </td>
                  <td className="p-3 border-r border-neutral-200 text-right">
                    {formatPrice(item.price)}
                  </td>
                  <td className="p-3 text-right font-black">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs font-bold uppercase">
            <div className="flex justify-between">
              <span className="text-neutral-500">Items Subtotal:</span>
              <span>{formatPrice(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Delivery Fee:</span>
              <span>{formatPrice(order.shippingPrice)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({order.couponCode || 'COUPON'}):</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-black pt-2 text-sm font-black text-black">
              <span>Grand Total:</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t-2 border-black pt-6 text-center text-[9px] text-neutral-500 uppercase tracking-widest">
          <p>Thank you for shopping with JeansLoop. Genuine export quality guaranteed.</p>
        </div>
      </div>
    </div>
  );
}
