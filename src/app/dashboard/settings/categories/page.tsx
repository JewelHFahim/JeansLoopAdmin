'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/lib/api-types';

export default function CategoriesSettingsPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [form, setForm] = useState({ name: '', slug: '', description: '', order: 0 });

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
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsCreating(false);
      setForm({ name: '', slug: '', description: '', order: 0 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingCategory(null);
      setForm({ name: '', slug: '', description: '', order: 0 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category removed');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      order: cat.order,
    });
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', order: categories.length + 1 });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: form });
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
            Taxonomy & Structure
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Categories
          </h1>
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
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
                placeholder="Optional description"
              />
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
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
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
              <th className="p-4 border-r border-neutral-700">Order</th>
              <th className="p-4 border-r border-neutral-700">Category Name</th>
              <th className="p-4 border-r border-neutral-700">Slug</th>
              <th className="p-4 border-r border-neutral-700">Description</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 border-r border-neutral-200 font-mono text-center w-16">
                    {cat.order}
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
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteTarget(cat)}
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
        title="Delete Category"
        description={`Are you sure you want to delete category "${deleteTarget?.name}"?`}
        confirmLabel="Delete Category"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
