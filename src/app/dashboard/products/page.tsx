'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Plus, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/api-types';

export default function ProductsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-products', page, keyword],
    queryFn: async () => {
      const res = await productsApi.getAll({ page, limit: 10, keyword: keyword || undefined });
      return res.data;
    },
  });

  const products = response?.data || [];
  const pagination = response?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-black pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
            Catalog Management
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Products Registry
          </h1>
        </div>

        <Link href="/dashboard/products/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <SearchInput
          placeholder="SEARCH BY NAME, SKU, OR CATEGORY..."
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
              <th className="p-4 border-r border-neutral-700">Name & Category</th>
              <th className="p-4 border-r border-neutral-700">Price (BDT)</th>
              <th className="p-4 border-r border-neutral-700">Sizes & Stock</th>
              <th className="p-4 border-r border-neutral-700">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No products found matching query.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

                return (
                  <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black uppercase text-black">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {p.category}{p.color ? ` • ${p.color}` : ''} / /{p.slug}
                      </p>
                    </td>

                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black">{formatPrice(p.price)}</p>
                      {p.discountedPrice && p.discountedPrice > 0 && (
                        <p className="text-[10px] text-green-600">
                          Deal: {formatPrice(p.discountedPrice)}
                        </p>
                      )}
                    </td>

                    <td className="p-4 border-r border-neutral-200">
                      <p className="text-[11px] font-mono">
                        {p.variants?.map((v) => `${v.size}(${v.stock})`).join(', ')}
                      </p>
                      <p className="text-[9px] text-neutral-400 uppercase mt-0.5">
                        Total Units: {totalStock}
                      </p>
                    </td>

                    <td className="p-4 border-r border-neutral-200">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase ${
                          p.isDraft ? 'bg-neutral-200 text-neutral-600' : 'bg-black text-white'
                        }`}
                      >
                        {p.isDraft ? 'Draft' : 'Published'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/products/${p._id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Total {pagination.total} products
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Product Asset"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be reversed.`}
        confirmLabel="Delete Permanently"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
