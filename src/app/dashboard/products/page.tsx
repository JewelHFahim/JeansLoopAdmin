'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { EntityHistoryModal } from '@/components/dialogs/EntityHistoryModal';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  History,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/api-types';

export default function ProductsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'inStock' | 'lowStock' | 'outOfStock'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'price-low' | 'price-high' | 'name'

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null);

  // Fetch categories for dropdown
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-filter'],
    queryFn: async () => {
      const res = await categoriesApi.getAll();
      return res.data;
    },
  });
  const categories = categoriesRes?.data || [];

  // Fetch sizes from database
  const { data: sizesRes } = useQuery({
    queryKey: ['admin-product-sizes', categoryFilter],
    queryFn: async () => {
      try {
        const res = await productsApi.getSizes(categoryFilter || undefined);
        return res.data.data;
      } catch {
        return [];
      }
    },
  });
  const serverSizes = sizesRes || [];

  const WAIST_SIZES = ['30', '32', '34', '36', '38', '40', '42', '44'];
  const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

  const otherSizes = useMemo(() => {
    const knownSet = new Set([
      ...WAIST_SIZES.map((s) => s.toLowerCase()),
      ...APPAREL_SIZES.map((s) => s.toLowerCase()),
      '28',
      'xs',
      '2xl',
      '3xl',
      'xxl',
      'xxxl',
    ]);
    return serverSizes.filter((s) => !knownSet.has(s.toLowerCase()));
  }, [serverSizes]);

  // Fetch filtered products
  const { data: response, isLoading } = useQuery({
    queryKey: [
      'admin-products',
      page,
      keyword,
      categoryFilter,
      sizeFilter,
      statusFilter,
      stockFilter,
      sortOrder,
    ],
    queryFn: async () => {
      const res = await productsApi.getAll({
        page,
        limit: 10,
        keyword: keyword || undefined,
        category: categoryFilter || undefined,
        size: sizeFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        includeDrafts: true,
        stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
        sort: sortOrder,
      });
      return res.data;
    },
  });

  const products = response?.data || [];
  const pagination = response?.pagination;

  const hasActiveFilters = Boolean(
    keyword ||
      categoryFilter ||
      sizeFilter ||
      statusFilter !== 'all' ||
      stockFilter !== 'all' ||
      sortOrder !== 'newest'
  );

  const handleResetFilters = () => {
    setKeyword('');
    setCategoryFilter('');
    setSizeFilter('');
    setStatusFilter('all');
    setStockFilter('all');
    setSortOrder('newest');
    setPage(1);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-3 sm:pb-4 gap-3">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 block mb-0.5">
            Catalog Management
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic tracking-tight text-black leading-none">
            Products Registry
          </h1>
        </div>

        <Link href="/dashboard/products/new">
          <Button size="sm" className="gap-2 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex items-center justify-between border-b border-black/15 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span className="text-xs font-black uppercase tracking-wider text-black">Filter & Search</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-red-600 hover:text-red-700 hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-1">
            <SearchInput
              placeholder="SEARCH NAME, SKU..."
              onDebouncedChange={(val) => {
                setKeyword(val);
                setPage(1);
              }}
              isLoading={isLoading}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter Dropdown */}
          <div>
            <select
              value={sizeFilter}
              onChange={(e) => {
                setSizeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
            >
              <option value="">All Sizes</option>
              <optgroup label="Waist / Pants">
                {WAIST_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Standard Apparel">
                {APPAREL_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </optgroup>
              {otherSizes.length > 0 && (
                <optgroup label="Other Sizes">
                  {otherSizes.map((sz) => (
                    <option key={sz} value={sz}>
                      Size {sz}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
            >
              <option value="all">All Stock Levels</option>
              <option value="inStock">In Stock (&gt; 0)</option>
              <option value="lowStock">Low Stock (≤ 5)</option>
              <option value="outOfStock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 border-2 border-black bg-white px-3 text-xs font-bold uppercase outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Quick Size Chips Toolbar */}
        <div className="pt-2 border-t border-black/10 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-black" /> Quick Size:
          </span>
          <button
            type="button"
            onClick={() => {
              setSizeFilter('');
              setPage(1);
            }}
            className={`h-6 px-2 text-[10px] font-black uppercase transition-all border ${
              !sizeFilter
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-black hover:bg-neutral-50'
            }`}
          >
            All
          </button>
          {[...WAIST_SIZES, ...APPAREL_SIZES, ...otherSizes].map((sz) => {
            const isSelected = sizeFilter.toLowerCase() === sz.toLowerCase();
            return (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  setSizeFilter(isSelected ? '' : sz);
                  setPage(1);
                }}
                className={`h-6 min-w-[28px] px-2 text-[10px] font-black uppercase transition-all border ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-50'
                }`}
              >
                {sz}
              </button>
            );
          })}
          {sizeFilter && (
            <button
              type="button"
              onClick={() => {
                setSizeFilter('');
                setPage(1);
              }}
              className="text-[10px] font-bold text-red-600 hover:underline ml-2 uppercase"
            >
              Clear size (Size: {sizeFilter})
            </button>
          )}
        </div>
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
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                  Loading Catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase space-y-2">
                  <p>No products found matching active filters.</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                      Reset All Filters
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                const isOutOfStock = totalStock === 0;
                const isLowStock = totalStock > 0 && totalStock <= 5;

                return (
                  <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                    {/* Name & Category */}
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black uppercase text-black">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {p.category}{p.color ? ` • ${p.color}` : ''} / /{p.slug}
                      </p>
                    </td>

                    {/* Price */}
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black">{formatPrice(p.price)}</p>
                      {p.discountedPrice && p.discountedPrice > 0 && (
                        <p className="text-[10px] text-green-600">
                          Deal: {formatPrice(p.discountedPrice)}
                        </p>
                      )}
                    </td>

                    {/* Stock & Sizes */}
                    <td className="p-4 border-r border-neutral-200">
                      <div className="flex flex-wrap gap-1 mb-1.5 max-w-xs">
                        {p.variants?.map((v, idx) => {
                          const isMatch =
                            sizeFilter &&
                            v.size.toLowerCase() === sizeFilter.toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSizeFilter(v.size);
                                setPage(1);
                              }}
                              title={`Filter by size ${v.size} (Stock: ${v.stock})`}
                              className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 border transition-all ${
                                isMatch
                                  ? 'bg-black text-white border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                  : v.stock === 0
                                  ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through'
                                  : 'bg-white text-neutral-800 border-neutral-300 hover:border-black hover:bg-neutral-50'
                              }`}
                            >
                              <span>{v.size}</span>
                              <span
                                className={`text-[9px] ${
                                  isMatch ? 'text-neutral-300' : 'text-neutral-500'
                                }`}
                              >
                                ({v.stock})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.2 border ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-green-50 text-green-700 border-green-300'
                          }`}
                        >
                          {isOutOfStock ? (
                            <>
                              <XCircle className="w-2.5 h-2.5" /> Out of stock
                            </>
                          ) : isLowStock ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5" /> Low: {totalStock} units
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" /> In stock: {totalStock}
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 border-r border-neutral-200">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase ${
                          p.isDraft ? 'bg-neutral-200 text-neutral-600' : 'bg-black text-white'
                        }`}
                      >
                        {p.isDraft ? 'Draft' : 'Published'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setHistoryTarget(p)}
                          className="h-8 w-8"
                          title="View History & Edits"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/dashboard/products/${p._id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Product">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          className="h-8 w-8"
                          title="Delete Product"
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
            Total {pagination.total} Products
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

      {/* History Modal */}
      <EntityHistoryModal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        entityType="PRODUCT"
        entityId={historyTarget?._id || ''}
        entityTitle={historyTarget?.name || ''}
        productData={historyTarget}
      />
    </div>
  );
}
