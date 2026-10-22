'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Save,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Product, ProductVariant, SizeChartRow } from '@/lib/api-types';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  isSubmitting: boolean;
  title: string;
}

// Industry-standard presets for instant 1-click variant generation
const SIZE_PRESETS = [
  {
    name: 'Tops / T-Shirts / Shirts',
    category: 'tops',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  },
  {
    name: 'Jeans / Pants / Trousers',
    category: 'bottoms',
    sizes: ['28', '30', '32', '34', '36', '38', '40'],
  },
  {
    name: 'Shoes / Footwear (EU)',
    category: 'shoes',
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  },
  {
    name: 'One Size / Accessories',
    category: 'onesize',
    sizes: ['Free Size'],
  },
];

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

  // Helper to extract or guess Base SKU from initial variants or slug
  const getInitialBaseSku = () => {
    if (initialData?.variants?.[0]?.sku) {
      const firstSku = initialData.variants[0].sku;
      const lastHyphen = firstSku.lastIndexOf('-');
      if (lastHyphen > 0) {
        return firstSku.substring(0, lastHyphen).toUpperCase();
      }
      return firstSku.toUpperCase();
    }
    if (initialData?.slug) {
      return initialData.slug.toUpperCase();
    }
    return '';
  };

  const [baseSku, setBaseSku] = useState<string>(getInitialBaseSku);
  const [defaultStock, setDefaultStock] = useState<number>(10);
  const [customSizesInput, setCustomSizesInput] = useState<string>('');

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
    variants: initialData?.variants?.length ? initialData.variants : [],
    sizeChart: initialData?.sizeChart || [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [highlightInput, setHighlightInput] = useState('');

  // SKU formatting helper: BASE-SIZE (e.g. PDS2004-M or SHOE-41)
  const formatSku = (base: string, size: string) => {
    const cleanBase = (base || form.slug || 'ITEM')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, '-');
    const cleanSize = size.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '-');
    return `${cleanBase}-${cleanSize}`;
  };

  // Handle slug and auto-detect base SKU on name change
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

    // Auto-detect style code pattern like PDS2004 or JL-100 if baseSku not yet customized
    if (!initialData && (!baseSku || baseSku === form.slug.toUpperCase())) {
      const codeMatch = name.match(/\b([A-Za-z0-9_-]{3,14})\b$/);
      if (codeMatch) {
        setBaseSku(codeMatch[1].toUpperCase());
      } else if (slug) {
        setBaseSku(slug.toUpperCase());
      }
    }
  };

  // Synchronize color changes to all variants
  const handleColorChange = (color: string) => {
    setForm((prev) => ({
      ...prev,
      color,
      variants: prev.variants.map((v) => ({ ...v, color })),
    }));
  };

  // Handle base price change with smart auto-sync
  const handlePriceChange = (newPrice: number) => {
    setForm((prev) => {
      const oldPrice = prev.price;
      // Auto-update variants if they matched the previous price or were 0
      const shouldAutoUpdate =
        prev.variants.length > 0 &&
        prev.variants.every((v) => v.price === oldPrice || v.price === 0);

      return {
        ...prev,
        price: newPrice,
        variants: shouldAutoUpdate
          ? prev.variants.map((v) => ({ ...v, price: newPrice }))
          : prev.variants,
      };
    });
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

  // ─── Smart Variant Operations ─────────────────────────────

  // Toggle size: if added, remove; if not added, add with inherited price/color/SKU
  const toggleSize = (size: string) => {
    const cleanSize = size.trim();
    if (!cleanSize) return;

    const existingIndex = form.variants.findIndex(
      (v) => v.size.toLowerCase() === cleanSize.toLowerCase()
    );

    if (existingIndex > -1) {
      setForm((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== existingIndex),
      }));
      toast.info(`Removed size ${cleanSize}`);
    } else {
      const newVariant: ProductVariant = {
        sku: formatSku(baseSku, cleanSize),
        size: cleanSize,
        color: form.color || 'Default',
        price: form.price > 0 ? form.price : 0,
        stock: defaultStock >= 0 ? defaultStock : 10,
      };

      setForm((prev) => ({
        ...prev,
        variants: [...prev.variants, newVariant],
      }));
      toast.success(`Added size ${cleanSize}`);
    }
  };

  // Add multiple sizes at once from preset or custom input
  const addMultipleSizes = (sizesList: string[]) => {
    const existingSet = new Set(form.variants.map((v) => v.size.toLowerCase()));
    const newSizes = sizesList
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !existingSet.has(s.toLowerCase()));

    if (newSizes.length === 0) {
      toast.info('All selected sizes are already in the list');
      return;
    }

    const newVariants: ProductVariant[] = newSizes.map((size) => ({
      sku: formatSku(baseSku, size),
      size,
      color: form.color || 'Default',
      price: form.price > 0 ? form.price : 0,
      stock: defaultStock >= 0 ? defaultStock : 10,
    }));

    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));

    toast.success(`Added ${newVariants.length} sizes (${newSizes.join(', ')})`);
  };

  // Handle freeform custom size input (e.g. "M, L, XL" or "40 41 42 43")
  const handleCustomSizesAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSizesInput.trim()) return;

    const parsedSizes = customSizesInput
      .split(/[,/\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    addMultipleSizes(parsedSizes);
    setCustomSizesInput('');
  };

  // Sync all variants to the current base price
  const syncAllPrices = () => {
    if (form.price <= 0) {
      toast.error('Set a valid base price first');
      return;
    }
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({ ...v, price: form.price })),
    }));
    toast.success(`Applied ৳${form.price} to all ${form.variants.length} size variants`);
  };

  // Sync all variant SKUs with current Base SKU prefix
  const syncAllSkus = () => {
    const base = baseSku.trim() || form.slug.trim() || 'ITEM';
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        sku: formatSku(base, v.size || 'STD'),
      })),
    }));
    toast.success(`Updated all variant SKUs using prefix "${base}"`);
  };

  // Apply default stock quantity to all variants
  const applyStockToAll = () => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({ ...v, stock: defaultStock })),
    }));
    toast.success(`Set stock to ${defaultStock} for all variants`);
  };

  // Clear all variants
  const clearAllVariants = () => {
    if (window.confirm('Clear all size variants?')) {
      setForm((prev) => ({ ...prev, variants: [] }));
      toast.info('Cleared all variants');
    }
  };

  // Add a single custom row manually
  const addVariant = () => {
    const defaultIndex = form.variants.length + 1;
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: formatSku(baseSku, `V${defaultIndex}`),
          size: '',
          color: prev.color || 'Default',
          price: prev.price > 0 ? prev.price : 0,
          stock: defaultStock >= 0 ? defaultStock : 10,
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

  // ─── Size Chart Operations ────────────────────────────────

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

  // ─── Highlights Operations ────────────────────────────────

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

  // ─── Form Submission ──────────────────────────────────────

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
      toast.error('Please add at least one product size variant (e.g. M, L, XL)');
      return;
    }

    const emptySizeIndex = form.variants.findIndex((v) => !v.size?.trim());
    if (emptySizeIndex > -1) {
      toast.error(`Variant #${emptySizeIndex + 1} is missing a size`);
      return;
    }

    // Ensure clean, unique SKUs across variants
    const skuMap: Record<string, number> = {};
    const sanitizedVariants = form.variants.map((v) => {
      const cleanSize = v.size.trim();
      let cleanSku = (v.sku || formatSku(baseSku, cleanSize)).trim();
      if (!cleanSku) {
        cleanSku = formatSku(baseSku, cleanSize);
      }

      skuMap[cleanSku] = (skuMap[cleanSku] || 0) + 1;
      if (skuMap[cleanSku] > 1) {
        cleanSku = `${cleanSku}-${cleanSize}`;
      }

      return {
        ...v,
        size: cleanSize,
        sku: cleanSku,
        color: form.color.trim(),
        price: Number(v.price) >= 0 ? Number(v.price) : form.price,
        stock: Number(v.stock) >= 0 ? Number(v.stock) : 0,
      };
    });

    const submissionData = {
      ...form,
      color: form.color.trim(),
      variants: sanitizedVariants,
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

          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Product
              </>
            )}
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
                  placeholder="e.g. Printed Drop Shoulder T-Shirt - PDS2004"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baseSku">Base SKU / Product Code *</Label>
                <Input
                  id="baseSku"
                  value={baseSku}
                  onChange={(e) => setBaseSku(e.target.value.toUpperCase())}
                  placeholder="e.g. PDS2004, SHOE-101"
                  className="font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Product Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="printed-drop-shoulder-t-shirt"
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
                  placeholder="e.g. Black, Vintage Blue, Raw Indigo"
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
                <Label htmlFor="price">Base Price (৳) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comparePrice">Compare Price (৳)</Label>
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

          {/* ─── Smart Variant & Size Matrix ──────────────────────── */}
          <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            {/* Variants Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    Size & Inventory Matrix
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black bg-neutral-100">
                    {form.variants.length} Sizes
                  </span>
                </div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                  Inherits product price (৳{form.price}) & color ({form.color || 'Default'})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border-2 border-black bg-neutral-50 px-2 py-1 gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500">
                    Prefix:
                  </span>
                  <span className="text-xs font-mono font-black text-black">
                    {baseSku || form.slug?.toUpperCase() || 'ITEM'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={syncAllSkus}
                    title="Synchronize all variant SKUs with Base SKU"
                    className="h-6 px-1.5 text-[8px] font-black uppercase"
                  >
                    Sync SKUs
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Size Selectors */}
            <div className="bg-neutral-50 border-2 border-black p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Quick Size Selectors (Click Chip to Toggle)
                </span>
                <span className="text-[9px] font-bold text-neutral-400 uppercase hidden sm:inline">
                  Black = Active / Added
                </span>
              </div>

              {/* Presets by category */}
              <div className="space-y-2.5">
                {SIZE_PRESETS.map((preset) => (
                  <div key={preset.name} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 sm:w-40 shrink-0">
                      {preset.name}:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {preset.sizes.map((sz) => {
                        const isAdded = form.variants.some(
                          (v) => v.size.toLowerCase() === sz.toLowerCase()
                        );
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            title={isAdded ? `Remove size ${sz}` : `Add size ${sz}`}
                            className={`h-7 min-w-[32px] px-2.5 text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                              isAdded
                                ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                                : 'bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-100'
                            }`}
                          >
                            {isAdded ? `✓ ${sz}` : `+ ${sz}`}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addMultipleSizes(preset.sizes)}
                        className="h-7 text-[9px] px-2 font-black uppercase tracking-wider border-2 border-black bg-white hover:bg-neutral-200 transition-colors ml-1"
                      >
                        + All {preset.category.toUpperCase()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Freeform Quick Input & Default Stock */}
              <div className="pt-3 border-t border-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Freeform Custom Size Input */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={customSizesInput}
                    onChange={(e) => setCustomSizesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomSizesAdd();
                      }
                    }}
                    placeholder="Custom sizes (e.g. 40, 41, 42 or M, L, XL)..."
                    className="h-8 text-xs font-bold bg-white"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCustomSizesAdd()}
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-wider shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Default Stock Configurator */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    Default Stock:
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={defaultStock}
                    onChange={(e) => setDefaultStock(Number(e.target.value))}
                    className="h-8 w-16 text-xs font-black text-center bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyStockToAll}
                    title="Set this stock count on all current size variants"
                    className="h-8 text-[9px] px-2 font-black uppercase border-black"
                  >
                    Apply All
                  </Button>
                </div>
              </div>
            </div>

            {/* Batch Controls Bar for Active Variants */}
            {form.variants.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-100 border-2 border-black">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  Total Inventory: <strong>{form.variants.reduce((acc, v) => acc + (v.stock || 0), 0)} units</strong> across {form.variants.length} sizes
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={syncAllPrices}
                    className="h-7 text-[9px] px-2.5 font-black uppercase bg-white border-black"
                  >
                    Apply ৳{form.price} to All Sizes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    className="h-7 text-[9px] px-2.5 font-black uppercase bg-white border-black"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Single
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={clearAllVariants}
                    className="h-7 text-[9px] px-2.5 font-black uppercase"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Variant Rows Table */}
            {form.variants.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-300 p-8 text-center bg-neutral-50">
                <Layers className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-xs font-black uppercase text-neutral-500 mb-1">
                  No size variants added yet
                </p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Click any size button above (like M, L, XL or 40, 41, 42) to add variants in 1 click!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                  <div className="col-span-2">Size</div>
                  <div className="col-span-4">Variant SKU</div>
                  <div className="col-span-3">Price (৳)</div>
                  <div className="col-span-2">Stock Qty</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {form.variants.map((variant, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-3 p-3 border-2 border-black items-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
                  >
                    {/* Size */}
                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <Label className="text-[9px] sm:hidden font-bold">Size *</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="w-8 h-8 flex items-center justify-center font-black text-xs bg-black text-white shrink-0">
                          {variant.size || '?'}
                        </span>
                        <Input
                          className="h-8 text-xs font-black uppercase tracking-wider"
                          value={variant.size}
                          onChange={(e) => updateVariant(i, 'size', e.target.value)}
                          placeholder="Size"
                          required
                        />
                      </div>
                    </div>

                    {/* SKU */}
                    <div className="col-span-1 sm:col-span-4 space-y-1">
                      <Label className="text-[9px] sm:hidden font-bold">SKU *</Label>
                      <Input
                        className="h-8 text-xs font-mono font-bold"
                        value={variant.sku}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        placeholder="SKU"
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-1 sm:col-span-3 space-y-1">
                      <Label className="text-[9px] sm:hidden font-bold">Price (৳) *</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs font-black"
                        value={variant.price}
                        onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Stock */}
                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <Label className="text-[9px] sm:hidden font-bold">Stock *</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs font-black"
                        value={variant.stock}
                        onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Delete Action */}
                    <div className="col-span-2 sm:col-span-1 flex justify-end items-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVariant(i)}
                        className="h-8 w-8 p-0"
                        title="Remove size"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
