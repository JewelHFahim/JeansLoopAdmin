'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slidersApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Plus, Trash2, Edit2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Slider } from '@/lib/api-types';

export default function SlidersManagementPage() {
  const queryClient = useQueryClient();
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Slider | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    primaryCtaText: '',
    primaryCtaHref: '',
    order: 1,
    isActive: true,
  });

  const { data: slidersRes, isLoading } = useQuery({
    queryKey: ['admin-sliders'],
    queryFn: async () => {
      const res = await slidersApi.getAll();
      return res.data.data;
    },
  });

  const sliders = slidersRes || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => slidersApi.create(data),
    onSuccess: () => {
      toast.success('Slider created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders'] });
      setIsCreating(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create slider'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => slidersApi.update(id, data),
    onSuccess: () => {
      toast.success('Slider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders'] });
      setEditingSlider(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update slider'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => slidersApi.delete(id),
    onSuccess: () => {
      toast.success('Slider deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete slider'),
  });

  const handleStartEdit = (s: Slider) => {
    setEditingSlider(s);
    setIsCreating(false);
    setForm({
      title: s.title,
      subtitle: s.subtitle || '',
      image: s.image,
      primaryCtaText: s.primaryCta?.text || '',
      primaryCtaHref: s.primaryCta?.href || '',
      order: s.order,
      isActive: s.isActive,
    });
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingSlider(null);
    setForm({
      title: '',
      subtitle: '',
      image: '',
      primaryCtaText: 'Shop Now',
      primaryCtaHref: '/shop',
      order: sliders.length + 1,
      isActive: true,
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, image: res.data.data.image }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      toast.error('Slider image is required');
      return;
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      image: form.image,
      primaryCta: form.primaryCtaText
        ? { text: form.primaryCtaText, href: form.primaryCtaHref || '/shop' }
        : null,
      order: form.order,
      isActive: form.isActive,
    };

    if (editingSlider) {
      updateMutation.mutate({ id: editingSlider._id, data: payload });
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
            Visual Storytelling
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            Hero Sliders
          </h1>
        </div>

        {!isCreating && !editingSlider && (
          <Button size="sm" onClick={handleStartCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Slide
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingSlider) && (
        <form
          onSubmit={handleSave}
          className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in fade-in"
        >
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest">
              {editingSlider ? 'Edit Hero Slide' : 'New Hero Slide'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingSlider(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Slide Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Precision Denim Fit"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Subtitle / Description</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Short supportive tagline"
              />
            </div>

            <div className="space-y-1">
              <Label>Primary CTA Text</Label>
              <Input
                value={form.primaryCtaText}
                onChange={(e) => setForm({ ...form, primaryCtaText: e.target.value })}
                placeholder="e.g. Shop Denim"
              />
            </div>

            <div className="space-y-1">
              <Label>Primary CTA Link</Label>
              <Input
                value={form.primaryCtaHref}
                onChange={(e) => setForm({ ...form, primaryCtaHref: e.target.value })}
                placeholder="/shop?category=jeans"
              />
            </div>

            <div className="space-y-1">
              <Label>Display Sequence Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1 flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black uppercase">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded-none border-2 border-black"
                />
                <span>Active On Homepage</span>
              </label>
            </div>
          </div>

          {/* Banner Image */}
          <div className="space-y-2 border-t-2 border-neutral-100 pt-4">
            <Label>Slide Banner Image (1920x800 recommended) *</Label>
            <div className="flex items-center gap-4">
              <label className="border-2 border-dashed border-black px-4 py-2 cursor-pointer hover:bg-neutral-50 text-xs font-black uppercase flex items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {form.image && (
                <div className="relative w-32 h-16 border-2 border-black overflow-hidden bg-neutral-100">
                  <Image src={form.image} alt="Slide Preview" fill className="object-cover" />
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
                setEditingSlider(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingSlider ? 'Update Slide' : 'Save Slide'}
            </Button>
          </div>
        </form>
      )}

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map((s) => (
          <div
            key={s._id}
            className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            <div className="relative h-48 w-full bg-neutral-100 border-b-2 border-black">
              {s.image && <Image src={s.image} alt={s.title} fill className="object-cover" />}
              <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase">
                Order #{s.order} — {s.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="p-4 flex justify-between items-end">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-black">{s.title}</h3>
                {s.subtitle && (
                  <p className="text-xs text-neutral-500 font-medium line-clamp-1">{s.subtitle}</p>
                )}
                {s.primaryCta && (
                  <p className="text-[10px] font-mono text-neutral-400 mt-1">
                    CTA: {s.primaryCta.text} → {s.primaryCta.href}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleStartEdit(s)} className="h-8 w-8">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteTarget(s)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Slider"
        description={`Are you sure you want to delete slide "${deleteTarget?.title}"?`}
        confirmLabel="Delete Slide"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
