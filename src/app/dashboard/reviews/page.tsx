'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { reviewsApi } from '@/lib/api';
import type { ReviewItem, ReviewProductInfo } from '@/lib/api-types';
import { toast } from 'sonner';

export default function ReviewsModerationPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Deletion Dialog State
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);

  // Fetch reviews query
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reviews', statusFilter, ratingFilter, keyword, page],
    queryFn: async () => {
      const res = await reviewsApi.getAll({
        status: statusFilter,
        rating: ratingFilter,
        keyword: keyword || undefined,
        page,
        limit,
      });
      return res.data.data;
    },
  });

  const reviews = response?.items || [];
  const counts = response?.counts || { pending: 0, approved: 0, rejected: 0, total: 0 };
  const pagination = response?.pagination || { page: 1, limit, total: 0, pages: 1 };

  // Status Mutation (Approve / Reject / Reset)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'pending' }) =>
      reviewsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending-count'] });
      const actionText =
        variables.status === 'approved'
          ? 'Review approved and published to storefront'
          : variables.status === 'rejected'
          ? 'Review rejected and hidden from storefront'
          : 'Review status reset to pending';
      toast.success(actionText);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update review status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending-count'] });
      toast.success('Review permanently removed');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete review');
    },
  });

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

  const fitLabelMap: Record<string, string> = {
    true_to_size: 'True to Size',
    runs_small: 'Runs Small',
    runs_large: 'Runs Large',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 block mb-0.5">
            Community & Quality Control
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic tracking-tight text-black leading-none">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-neutral-600 font-medium mt-1">
            Authenticate and moderate customer denim feedback before publishing to product showcases.
          </p>
        </div>

        {/* Quick Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending-count'] });
          }}
          disabled={isFetching}
          className="self-start sm:self-auto text-xs font-bold gap-1.5"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 2. Stat Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reviews */}
        <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              Total Reviews
            </span>
            <MessageSquare className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black mt-2">
            {counts.total}
          </div>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
            All submitted feedback
          </p>
        </Card>

        {/* Pending Approval (Action Needed) */}
        <Card
          className={`border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-100 ring-2 ring-black'
              : counts.pending > 0
              ? 'bg-amber-50 hover:bg-amber-100'
              : 'bg-white'
          }`}
          onClick={() => {
            setStatusFilter('pending');
            setPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
              Pending Approval
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-2 flex items-center gap-2">
            {counts.pending}
            {counts.pending > 0 && (
              <span className="bg-amber-400 text-black border border-black text-[9px] font-black px-1.5 py-0.2">
                ACTION
              </span>
            )}
          </div>
          <p className="text-[10px] text-amber-800 font-medium mt-0.5">
            Awaiting admin decision
          </p>
        </Card>

        {/* Approved Reviews */}
        <Card
          className={`border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer ${
            statusFilter === 'approved' ? 'bg-emerald-100 ring-2 ring-black' : 'bg-white hover:bg-neutral-50'
          }`}
          onClick={() => {
            setStatusFilter('approved');
            setPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black mt-2">
            {counts.approved}
          </div>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
            Visible on store catalog
          </p>
        </Card>

        {/* Rejected Reviews */}
        <Card
          className={`border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer ${
            statusFilter === 'rejected' ? 'bg-neutral-200 ring-2 ring-black' : 'bg-white hover:bg-neutral-50'
          }`}
          onClick={() => {
            setStatusFilter('rejected');
            setPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black mt-2">
            {counts.rejected}
          </div>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
            Hidden / Non-compliant
          </p>
        </Card>
      </div>

      {/* 3. Toolbar: Status Tabs + Star Dropdown + Search Input */}
      <div className="border-2 border-black p-3 sm:p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Status Filter Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(
            [
              { key: 'all', label: 'All Reviews', count: counts.total, alert: false },
              { key: 'pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
              { key: 'approved', label: 'Approved', count: counts.approved, alert: false },
              { key: 'rejected', label: 'Rejected', count: counts.rejected, alert: false },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-black bg-white text-black hover:bg-neutral-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-black ${
                    tab.alert
                      ? 'bg-amber-400 text-black border border-black'
                      : isActive
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-200 text-black'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Rating Dropdown & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Star Filter Dropdown */}
          <select
            value={ratingFilter ?? ''}
            onChange={(e) => {
              setRatingFilter(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
          >
            <option value="">All Star Ratings</option>
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search reviewer, title, text..."
              value={keyword}
              initialValue={keyword}
              onDebouncedChange={(val) => {
                setKeyword(val);
                setPage(1);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* 4. Reviews List */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* Mobile Scroll Hint */}
        <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-neutral-100 border-b border-black text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
          <span>Reviews Registry ({pagination.total})</span>
          <span>← Scroll horizontally →</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[840px]">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-wider border-b-2 border-black">
                <th className="p-3 w-56">Product</th>
                <th className="p-3 w-48">Reviewer</th>
                <th className="p-3 w-44">Rating & Fit</th>
                <th className="p-3">Review Feedback</th>
                <th className="p-3 w-36">Status</th>
                <th className="p-3 w-44 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase text-xs">
                    Loading customer reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <h3 className="text-sm font-black uppercase text-black">
                      No Reviews Found
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-1">
                      {statusFilter === 'pending'
                        ? 'Great job! There are no pending reviews awaiting approval.'
                        : 'No reviews matched your active filters or search term.'}
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const product = typeof rev.productId === 'object' ? (rev.productId as ReviewProductInfo) : null;
                  const productImage = product?.images?.[0] || '/images/placeholder.jpg';
                  const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={rev._id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        rev.status === 'pending' ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* 1. Target Product */}
                      <td className="p-3 align-top">
                        {product ? (
                          <div className="flex items-start gap-2.5">
                            <div className="w-12 h-14 relative shrink-0 border border-black bg-neutral-100 overflow-hidden">
                              <Image
                                src={productImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <a
                                href={`${storefrontUrl}/product/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-black text-black hover:underline line-clamp-2 leading-tight"
                              >
                                {product.name}
                              </a>
                              <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-neutral-400">
                            Product #{String(rev.productId).slice(-6)}
                          </span>
                        )}
                      </td>

                      {/* 2. Customer Info */}
                      <td className="p-3 align-top space-y-1">
                        <div className="text-xs font-bold text-black flex items-center gap-1.5">
                          <span>{rev.name}</span>
                          {rev.verifiedPurchase && (
                            <span
                              title="Verified Buyer"
                              className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase text-emerald-800 bg-emerald-50 px-1 py-0.2 border border-emerald-300"
                            >
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Buyer
                            </span>
                          )}
                        </div>
                        {rev.email && (
                          <div className="text-[10px] text-neutral-500 font-mono truncate">
                            {rev.email}
                          </div>
                        )}
                        <div className="text-[9px] text-neutral-400 font-mono">
                          {formattedDate}
                        </div>
                      </td>

                      {/* 3. Rating & Fit */}
                      <td className="p-3 align-top space-y-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-black ml-1 text-black">
                            {rev.rating}.0
                          </span>
                        </div>

                        {rev.fit && (
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase border border-neutral-300 bg-neutral-100 text-neutral-700">
                            Fit: {fitLabelMap[rev.fit] || rev.fit}
                          </span>
                        )}
                      </td>

                      {/* 4. Review Content */}
                      <td className="p-3 align-top space-y-1 max-w-md">
                        <h4 className="text-xs font-black text-black leading-snug">
                          {rev.title}
                        </h4>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed whitespace-pre-line line-clamp-3 hover:line-clamp-none transition-all">
                          {rev.comment}
                        </p>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="p-3 align-top">
                        {rev.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        {rev.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {rev.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-neutral-200 text-neutral-700 border border-neutral-400">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* 6. Action Controls */}
                      <td className="p-3 align-top text-right space-y-1.5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {rev.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev._id, 'approved')}
                              disabled={statusMutation.isPending}
                              title="Approve review and publish to storefront"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white hover:bg-emerald-700 border border-black text-[10px] font-black uppercase tracking-wider transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {rev.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev._id, 'rejected')}
                              disabled={statusMutation.isPending}
                              title="Reject review and hide from storefront"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-800 border border-black text-[10px] font-black uppercase tracking-wider transition-colors"
                            >
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rev)}
                            title="Permanently delete review"
                            className="p-1 border border-neutral-300 hover:border-red-600 text-neutral-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-3 sm:p-4 border-t-2 border-black bg-neutral-50 text-xs">
            <span className="font-bold text-neutral-600 text-[11px]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total reviews)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isLoading}
                className="h-8 px-2 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages || isLoading}
                className="h-8 px-2 text-xs font-bold"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Customer Review"
        description={`Are you sure you want to permanently delete the review from "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Review"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget._id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
