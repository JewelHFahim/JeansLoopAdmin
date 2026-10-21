'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload, Loader2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Product, ProductVariant, SizeChartRow } from '@/lib/api-types';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  isSubmitting: boolean;
  title: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
  title,
}: ProductFormProps) {
  const router = useRouter();

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.getAll();
      return res.data.data;
    },
  });

  const categories = categoriesRes || [];

  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    color: initialData?.color || initialData?.variants?.[0]?.color || 'Classic Blue',
    description: initialData?.description || '',
    category: initialData?.category || '',
    price: initialData?.price || 0,
    comparePrice: initialData?.comparePrice || 0,
    discountAmount: initialData?.discountAmount || 0,
    discountPercentage: initialData?.discountPercentage || 0,
    isDraft: initialData?.isDraft ?? false,
    images: initialData?.images || [],
    highlights: initialData?.highlights || [],
    variants: initialData?.variants?.length
      ? initialData.variants
      : [
          { sku: '', size: '30', color: initialData?.color || 'Classic Blue', price: 0, stock: 10 },
        ],
    sizeChart: initialData?.sizeChart || [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [highlightInput, setHighlightInput] = useState('');

  // Handle slug generation on name change if not editing existing slug
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/ /g, '-')
      .replace(/[^a-z0-9_-]+/g, '');
    setForm((prev) => ({
      ...prev,
      name,
      slug: initialData ? prev.slug : slug,
    }));
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const url = res.data.data.image;
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleColorChange = (color: string) => {
    setForm((prev) => ({
      ...prev,
      color,
      variants: prev.variants.map((v) => ({ ...v, color })),
    }));
  };

  // Variant operations
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: `${prev.slug || 'item'}-${prev.variants.length + 1}`,
          size: '',
          color: prev.color || 'Classic Blue',
          price: prev.price,
          stock: 10,
        },
      ],
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Size chart operations
  const addSizeChartRow = () => {
    setForm((prev) => ({
      ...prev,
      sizeChart: [
        ...prev.sizeChart,
        { waist: '', thigh: '', legOpening: '', long: '' },
      ],
    }));
  };

  const updateSizeChartRow = (index: number, field: keyof SizeChartRow, val: string) => {
    setForm((prev) => {
      const updated = [...prev.sizeChart];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, sizeChart: updated };
    });
  };

  const removeSizeChartRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sizeChart: prev.sizeChart.filter((_, i) => i !== index),
    }));
  };

  // Highlights
  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, highlightInput.trim()],
    }));
    setHighlightInput('');
  };

  const removeHighlight = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.slug || !form.category || form.price <= 0) {
      toast.error('Please fill in product name, slug, category, and price');
      return;
    }

    if (!form.color?.trim()) {
      toast.error('Please specify the product color');
      return;
    }

    if (form.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    if (form.variants.length === 0) {
      toast.error('Please add at least one product size variant');
      return;
    }

    const submissionData = {
      ...form,
      color: form.color.trim(),
      variants: form.variants.map((v) => ({
        ...v,
        color: form.color.trim(),
      })),
    };

    await onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-black leading-none">
              {title}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Inventory Nexus / Asset Configuration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-black uppercase">
            <input
              type="checkbox"
              checked={form.isDraft}
              onChange={(e) => setForm({ ...form, isDraft: e.target.checked })}
              className="w-4 h-4 rounded-none border-2 border-black"
            />
            <span>Draft Mode</span>
          </label>

          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Primary Specifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Raw Indigo Selvage Denim"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Product Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="raw-indigo-selvage-denim"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="flex h-12 w-full rounded-none border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color">Product Color *</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="e.g. Raw Indigo, Vintage Blue, Black"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Detailed Description</Label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-none border-2 border-black p-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Fabric composition, cut, wash instructions, styling suggestions..."
              />
            </div>
          </div>

          {/* Pricing & Discounts */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Pricing Configuration (BDT)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Base Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comparePrice">Compare Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  min="0"
                  value={form.comparePrice}
                  onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discountPercentage">Discount %</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discountAmount">Discount ৳</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  min="0"
                  value={form.discountAmount}
                  onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-2 gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Stock Variants ({form.variants.length})
                </h2>
                {form.color && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-neutral-100">
                    Color: {form.color}
                  </span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="text-[10px]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Size Variant
              </Button>
            </div>

            <div className="space-y-3">
              {form.variants.map((variant, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 border-2 border-neutral-200 items-end bg-neutral-50"
                >
                  <div className="space-y-1">
                    <Label className="text-[9px]">SKU *</Label>
                    <Input
                      className="h-9 text-[10px]"
                      value={variant.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      placeholder="SKU"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Size *</Label>
                    <Input
                      className="h-9 text-[10px]"
                      value={variant.size}
                      onChange={(e) => updateVariant(i, 'size', e.target.value)}
                      placeholder="30, 32, M, L"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Price (৳)</Label>
                    <Input
                      type="number"
                      className="h-9 text-[10px]"
                      value={variant.price}
                      onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Stock Qty</Label>
                    <Input
                      type="number"
                      className="h-9 text-[10px]"
                      value={variant.stock}
                      onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariant(i)}
                      className="h-9 px-3"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Size Chart */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h2 className="text-sm font-black uppercase tracking-widest">
                Dimension Guide Matrix
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addSizeChartRow} className="text-[10px]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
              </Button>
            </div>

            {form.sizeChart.length === 0 ? (
              <p className="text-xs text-neutral-400 font-bold uppercase">No dimension rows defined.</p>
            ) : (
              <div className="space-y-2">
                {form.sizeChart.map((row, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                    <Input
                      className="h-9 text-[10px]"
                      placeholder="Waist"
                      value={row.waist}
                      onChange={(e) => updateSizeChartRow(i, 'waist', e.target.value)}
                    />
                    <Input
                      className="h-9 text-[10px]"
                      placeholder="Thigh"
                      value={row.thigh}
                      onChange={(e) => updateSizeChartRow(i, 'thigh', e.target.value)}
                    />
                    <Input
                      className="h-9 text-[10px]"
                      placeholder="Leg Open"
                      value={row.legOpening}
                      onChange={(e) => updateSizeChartRow(i, 'legOpening', e.target.value)}
                    />
                    <Input
                      className="h-9 text-[10px]"
                      placeholder="Length"
                      value={row.long}
                      onChange={(e) => updateSizeChartRow(i, 'long', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSizeChartRow(i)}
                      className="h-9 w-9 p-0 mx-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Media & Highlights */}
        <div className="space-y-8">
          {/* Images Upload */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Visual Assets ({form.images.length})
            </h2>

            <div className="space-y-3">
              <label className="border-2 border-dashed border-black p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors">
                {uploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2 text-black" />
                    <span className="text-[10px] font-black uppercase">Upload Image</span>
                    <span className="text-[8px] text-neutral-400 font-bold uppercase mt-1">
                      JPEG, PNG, WebP up to 8MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              {/* Grid of uploaded images */}
              <div className="grid grid-cols-2 gap-3">
                {form.images.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] border-2 border-black group overflow-hidden bg-neutral-100"
                  >
                    <Image src={url} alt={`Preview ${i}`} fill className="object-cover" sizes="150px" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2">
              Feature Highlights
            </h2>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. 100% Ring-spun cotton"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                className="h-10 text-[10px]"
              />
              <Button type="button" size="sm" onClick={addHighlight} className="h-10 px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 p-2 text-xs border border-neutral-200">
                  <span className="font-bold">{h}</span>
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
