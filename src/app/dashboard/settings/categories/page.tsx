'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Plus, Trash2, Edit2, Loader2, Upload, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/lib/api-types';

export default function CategoriesSettingsPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    order: 0,
  });

  const { data: categoriesRes, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await categoriesApi.getAll();
      return res.data.data;
    },
  });

  const categories = categoriesRes || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsCreating(false);
      setForm({ name: '', slug: '', description: '', image: '', order: 0 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => {
      toast.success('Category and banner updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingCategory(null);
      setForm({ name: '', slug: '', description: '', image: '', order: 0 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category removed');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete category'),
  });

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      order: cat.order,
    });
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      image: '',
      order: categories.length + 1,
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, image: res.data.data.image }));
      toast.success('Banner image uploaded successfully');
    } catch {
      toast.error('Failed to upload banner image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      order: Number(form.order) || 0,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-black pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
            Taxonomy & Structure
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Categories & Banners
          </h1>
          <p className="text-xs text-neutral-600 font-medium mt-1">
            Configure product categories and upload custom promotional banners for each homepage category section.
          </p>
        </div>

        {!isCreating && !editingCategory && (
          <Button size="sm" onClick={handleStartCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        )}
      </div>

      {/* Inline Create/Edit Form */}
      {(isCreating || editingCategory) && (
        <form
          onSubmit={handleSave}
          className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in"
        >
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest">
              {editingCategory ? `Edit: ${editingCategory.name}` : 'New Category'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCategory(null);
              }}
              className="p-1 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Category Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^a-z0-9_-]+/g, '');
                  setForm({ ...form, name, slug: editingCategory ? form.slug : slug });
                }}
                placeholder="e.g. T-Shirt, Twill, Jeans"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. t-shirt, twill"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional category description or tagline"
              />
            </div>
          </div>

          {/* Category Banner Image Control */}
          <div className="space-y-3 border-t-2 border-neutral-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-black uppercase tracking-wider block">
                  Category Section Banner Image (Homepage Showcase)
                </Label>
                <p className="text-[11px] text-neutral-500 font-medium">
                  This image controls the large 33% showcase banner for this category on the storefront homepage. (1200×800 recommended)
                </p>
              </div>
              {form.image && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                  className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:underline"
                >
                  Reset / Remove Custom Banner
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="border-2 border-dashed border-black px-4 py-2.5 cursor-pointer hover:bg-neutral-50 text-xs font-black uppercase flex items-center gap-2 flex-shrink-0 transition-colors">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Upload className="w-4 h-4 text-black" />
                )}
                <span>{uploading ? 'Uploading...' : 'Upload Banner'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <div className="flex-1 w-full space-y-1">
                <Input
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="Or paste banner image URL (e.g. https://... or /uploads/...)"
                  className="h-10 text-xs"
                />
              </div>

              {form.image ? (
                <div className="relative w-28 h-16 border-2 border-black overflow-hidden bg-neutral-100 flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Image
                    src={form.image}
                    alt="Category Banner Preview"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-black uppercase text-center py-0.5 truncate px-1">
                    Custom Banner
                  </div>
                </div>
              ) : (
                <div className="relative w-28 h-16 border-2 border-dashed border-neutral-300 overflow-hidden bg-neutral-50 flex flex-col items-center justify-center flex-shrink-0 text-neutral-400">
                  <ImageIcon className="w-5 h-5 mb-0.5 opacity-60" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">Default Preset</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase text-[10px] font-black tracking-wider">
              <th className="p-4 border-r border-neutral-700 w-16">Order</th>
              <th className="p-4 border-r border-neutral-700 w-28">Banner</th>
              <th className="p-4 border-r border-neutral-700">Category Name</th>
              <th className="p-4 border-r border-neutral-700">Slug</th>
              <th className="p-4 border-r border-neutral-700">Description</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 border-r border-neutral-200 font-mono text-center w-16">
                    {cat.order}
                  </td>
                  <td className="p-3 border-r border-neutral-200">
                    {cat.image ? (
                      <div className="relative w-24 h-12 border-2 border-black overflow-hidden bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[7px] font-black uppercase text-center py-0.5">
                          Custom
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Preset</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 border-r border-neutral-200 font-black uppercase text-black">
                    {cat.name}
                  </td>
                  <td className="p-4 border-r border-neutral-200 font-mono text-neutral-400">
                    /{cat.slug}
                  </td>
                  <td className="p-4 border-r border-neutral-200 text-neutral-500 font-normal">
                    {cat.description || '—'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStartEdit(cat)}
                        className="h-8 w-8"
                        title="Edit Category & Banner"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteTarget(cat)}
                        className="h-8 w-8"
                        title="Delete Category"
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
        title="Delete Category"
        description={`Are you sure you want to delete category "${deleteTarget?.name}"?`}
        confirmLabel="Delete Category"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
