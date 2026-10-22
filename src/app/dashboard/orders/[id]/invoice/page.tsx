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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-neutral-50 text-center">
        <div>
          <p className="text-sm font-semibold text-neutral-800">Order not found</p>
          <Link href="/dashboard/orders" className="text-xs text-neutral-500 underline mt-2 block">
            Return to orders
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const invoiceNumber = `JL-${order._id.slice(-6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white text-neutral-900 py-6 sm:py-10 px-4 print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111111 !important;
            font-size: 12px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside,
          header,
          nav,
          .no-print,
          [data-no-print] {
            display: none !important;
          }
          .invoice-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Screen Action Bar (Hidden on print) */}
      <div className="no-print max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <Link href={`/dashboard/orders/${order._id}`}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Order
          </Button>
        </Link>
        <Button
          onClick={() => window.print()}
          size="sm"
          className="gap-2 text-xs bg-black text-white hover:bg-neutral-800"
        >
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="invoice-sheet max-w-3xl mx-auto bg-white border border-neutral-200 p-8 sm:p-12 shadow-sm text-neutral-800 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-950">
              {settings?.title || 'JeansLoop'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {settings?.tagline || 'Premium Denim & Apparel'}
            </p>
            <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
              {settings?.address && <p>{settings.address}</p>}
              <p>
                {settings?.phone || '+880 1700-000000'} • {settings?.email || 'support@jeansloop.com'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900">Invoice</h2>
            <p className="text-xs font-mono font-medium text-neutral-600 mt-1">{invoiceNumber}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Date: {formattedDate}</p>
            <p className="text-xs font-semibold text-neutral-800 mt-1">
              {order.isPaid ? 'PAID' : 'CASH ON DELIVERY'}
            </p>
          </div>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px] mb-1.5">
              Billed To
            </p>
            <p className="font-bold text-sm text-neutral-950 uppercase">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-neutral-700 mt-0.5">{order.shippingAddress.phone}</p>
            {order.shippingAddress.altPhone && (
              <p className="text-neutral-500">Alt: {order.shippingAddress.altPhone}</p>
            )}
            <p className="text-neutral-700 mt-1 leading-relaxed">
              {order.shippingAddress.street}
            </p>
            <p className="text-neutral-900 font-medium">
              {order.shippingAddress.city}, {order.shippingAddress.country || 'Bangladesh'}
            </p>
            {order.shippingAddress.note && (
              <p className="text-neutral-500 italic mt-1.5 text-[11px]">
                Note: {order.shippingAddress.note}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px] mb-1.5">
              Order Details
            </p>
            <p className="text-neutral-600">
              Order Ref: <span className="font-mono text-neutral-900">#{order._id.slice(-6).toUpperCase()}</span>
            </p>
            <p className="text-neutral-600 mt-0.5">
              Payment: <span className="font-medium text-neutral-900 uppercase">{order.paymentMethod}</span>
            </p>
            {order.bkashTxnId && (
              <p className="text-neutral-600 mt-0.5 font-mono">TrxID: {order.bkashTxnId}</p>
            )}
            <p className="text-neutral-600 mt-0.5">
              Status: <span className="font-medium text-neutral-900 uppercase">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5">Item</th>
                <th className="py-2.5 text-center">Size</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-neutral-900 uppercase">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {item.variantSku}
                      {item.color && item.color !== 'Default' ? ` • ${item.color}` : ''}
                    </p>
                  </td>
                  <td className="py-3 text-center text-neutral-700 uppercase font-medium">
                    {item.size || '-'}
                  </td>
                  <td className="py-3 text-center text-neutral-700 font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-neutral-700">
                    {formatPrice(item.price)}
                  </td>
                  <td className="py-3 text-right font-semibold text-neutral-950">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="border-t border-neutral-200 pt-4 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="text-neutral-900">{formatPrice(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Shipping ({order.shippingAddress.city}):</span>
              <span className="text-neutral-900">{formatPrice(order.shippingPrice)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({order.couponCode || 'Coupon'}):</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-baseline font-bold text-sm text-neutral-950">
              <span>Total:</span>
              <span className="text-base">{formatPrice(order.totalAmount)}</span>
            </div>

            {!order.isPaid && (
              <p className="text-[11px] font-semibold text-neutral-900 text-right pt-1">
                Amount to Collect (COD): {formatPrice(order.totalAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
          <p>Thank you for shopping with JeansLoop!</p>
          <p className="text-[10px] text-neutral-400 mt-1">
            For support or size exchanges, contact us at {settings?.email || 'support@jeansloop.com'} or {settings?.phone || '+880 1700-000000'}.
          </p>
        </div>
      </div>
    </div>
  );
}
