'use client';

import { useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  History,
  X,
  Loader2,
  Clock,
  User,
  Shield,
  Package,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import type { ActivityLogItem, Order, Product } from '@/lib/api-types';

interface EntityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'ORDER' | 'PRODUCT';
  entityId: string;
  entityTitle: string;
  orderData?: Order | null;
  productData?: Product | null;
}

export function EntityHistoryModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  orderData,
  productData,
}: EntityHistoryModalProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['entity-history', entityType, entityId],
    queryFn: async () => {
      const res = await activityLogsApi.getAll({
        entityType,
        entityId,
        limit: 50,
      });
      return res.data;
    },
    enabled: isOpen && Boolean(entityId),
  });

  if (!isOpen) return null;

  const logs: ActivityLogItem[] = response?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg bg-white border-4 border-black p-6 md:p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] space-y-6 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white">
              {entityType === 'ORDER' ? (
                <ShoppingCart className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {entityType} Audit History
                </span>
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tight text-black line-clamp-1">
                {entityTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 border border-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-400 font-bold uppercase">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
              Loading History Records...
            </div>
          ) : logs.length > 0 ? (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/20">
              {logs.map((log) => {
                const date = new Date(log.createdAt);
                const dateFormatted = date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const timeFormatted = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <div key={log._id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm" />

                    <div className="p-3 bg-neutral-50 border border-neutral-300 space-y-1.5 hover:border-black transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{dateFormatted}</span>
                          <span>• {timeFormatted}</span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-neutral-900 leading-snug">
                        {log.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 border-t border-black/10 text-[10px] text-neutral-600">
                        <User className="w-3 h-3 text-neutral-400" />
                        <span className="font-bold text-black">{log.userName}</span>
                        <span className="font-mono text-neutral-400">({log.userEmail})</span>
                        <span className="text-[8px] bg-neutral-200 text-neutral-800 px-1 font-black uppercase">
                          {log.userRole}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback display for items before activity log was introduced */
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                  <Calendar className="w-4 h-4" /> Creation & Modification Record
                </div>

                <div className="text-xs space-y-2 text-neutral-600">
                  {orderData && (
                    <>
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                        <span className="font-medium text-neutral-500">Order Placed At:</span>
                        <span className="font-bold text-black font-mono">
                          {new Date(orderData.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(orderData.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                        <span className="font-medium text-neutral-500">Current Status:</span>
                        <span className="font-black text-black uppercase">
                          {orderData.status}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                        <span className="font-medium text-neutral-500">Customer:</span>
                        <span className="font-bold text-black uppercase">
                          {orderData.shippingAddress?.fullName}
                        </span>
                      </div>
                    </>
                  )}

                  {productData && (
                    <>
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                        <span className="font-medium text-neutral-500">Created At:</span>
                        <span className="font-bold text-black font-mono">
                          {new Date(productData.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(productData.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                        <span className="font-medium text-neutral-500">Last Modified:</span>
                        <span className="font-bold text-black font-mono">
                          {new Date(productData.updatedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(productData.updatedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-neutral-400 italic">
                  * Note: Real-time user logs will record automatically on future status changes and updates.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t-2 border-black pt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-bold uppercase">
            Close History
          </Button>
        </div>
      </div>
    </div>
  );
}
