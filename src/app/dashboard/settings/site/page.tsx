'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Clock,
  Megaphone,
  Upload,
  Loader2,
  ImageIcon,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Share2,
  PhoneCall,
  LayoutTemplate,
  Link as LinkIcon,
  Power,
  ArrowRight,
} from 'lucide-react';
import { settingsApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SiteSettings } from '@/lib/api-types';

type SettingsTab = 'brand' | 'contact' | 'social' | 'preview';

const DEFAULT_SETTINGS: SiteSettings = {
  title: 'JeansLoop',
  tagline: 'Premium Denim & Fashionwear',
  logo: '',
  email: 'support@jeansloop.com',
  phone: '+8801700000000',
  address: 'Dhaka, Bangladesh',
  locationMapUrl: '',
  businessHours: 'Sat - Thu, 10:00 AM - 08:00 PM',
  announcement: 'Complimentary shipping inside Dhaka on orders above ৳2,000!',
  announcementEnabled: true,
  announcementLink: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
    tiktok: '',
  },
};

export default function SiteSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = (searchParams.get('tab') as SettingsTab) || 'brand';
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (['brand', 'contact', 'social', 'preview'].includes(tabParam)) return tabParam;
    return 'brand';
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [initialData, setInitialData] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await settingsApi.get();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settingsRes) {
      const loaded: SiteSettings = {
        title: settingsRes.title || DEFAULT_SETTINGS.title,
        tagline: settingsRes.tagline || '',
        logo: settingsRes.logo || '',
        email: settingsRes.email || '',
        phone: settingsRes.phone || '',
        address: settingsRes.address || '',
        locationMapUrl: settingsRes.locationMapUrl || '',
        businessHours: settingsRes.businessHours || '',
        announcement: settingsRes.announcement || '',
        announcementEnabled: settingsRes.announcementEnabled !== false,
        announcementLink: settingsRes.announcementLink || '',
        socialLinks: {
          facebook: settingsRes.socialLinks?.facebook || '',
          instagram: settingsRes.socialLinks?.instagram || '',
          youtube: settingsRes.socialLinks?.youtube || '',
          whatsapp: settingsRes.socialLinks?.whatsapp || '',
          tiktok: settingsRes.socialLinks?.tiktok || '',
        },
      };
      setFormData(loaded);
      setInitialData(loaded);
      if (loaded.logo) {
        setLogoPreview(loaded.logo);
      }
    }
  }, [settingsRes]);

  // Sync tab with URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Track if any modifications have been made
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SiteSettings>) => settingsApi.update(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setInitialData(formData);
      toast.success('Site settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update site configurations');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const platform = name.split('.')[1] as keyof NonNullable<SiteSettings['socialLinks']>;
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const imageUrl = res.data.data.image;
      setFormData((prev) => ({ ...prev, logo: imageUrl }));
      setLogoPreview(imageUrl);
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }));
    setLogoPreview('');
    toast.info('Logo removed. Remember to save changes.');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save immediately from any tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Loading site configuration...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl pb-16">
      {/* Top Header & Sticky Save Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
              SYSTEM CONFIGURATION
            </span>
            {isDirty ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                <AlertCircle className="w-3 h-3 text-amber-700" /> Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced With Database
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-neutral-900">
            Store & Brand Settings
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Customize platform name, store logo, operating hours, support contacts, and social channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="h-11 px-6 bg-black text-white hover:bg-neutral-800 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Split Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-2 border-black p-1.5 bg-neutral-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          type="button"
          onClick={() => handleTabChange('brand')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'brand'
              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
              : 'bg-white text-neutral-700 hover:text-black hover:bg-neutral-50'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>Brand & Identity</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('contact')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'contact'
              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
              : 'bg-white text-neutral-700 hover:text-black hover:bg-neutral-50'
          }`}
        >
          <PhoneCall className="w-4 h-4 shrink-0" />
          <span>Contact & Operations</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('social')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'social'
              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
              : 'bg-white text-neutral-700 hover:text-black hover:bg-neutral-50'
          }`}
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>Social & Channels</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('preview')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'preview'
              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
              : 'bg-white text-neutral-700 hover:text-black hover:bg-neutral-50'
          }`}
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span>Storefront Preview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BRAND & IDENTITY                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'brand' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Core Brand Identity */}
            <div className="lg:col-span-7 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-black" />
                    Storefront Identity
                  </CardTitle>
                  <CardDescription>
                    Platform naming used on navigation headers, order invoices, and browser title
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-xs font-black uppercase tracking-wider">
                        Store / Brand Name *
                      </Label>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Primary Title
                      </span>
                    </div>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. JeansLoop, UrbanDenim, etc."
                      required
                    />
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Displayed on the main navbar, mobile header, order confirmation, and legal policies.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tagline" className="text-xs font-black uppercase tracking-wider">
                        Brand Tagline / Slogan
                      </Label>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Micro Tagline
                      </span>
                    </div>
                    <Input
                      id="tagline"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="e.g. Premium Denim & Modern Menswear"
                    />
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Appears under the logo text on desktop and in the footer brand overview.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Announcement Bar */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-black" />
                        Storefront Announcement Ticker
                      </CardTitle>
                      <CardDescription>
                        Highlighted banner message displayed at the very top of the storefront
                      </CardDescription>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {formData.announcementEnabled !== false && formData.announcement?.trim() ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border-2 border-emerald-800 text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          Live on Storefront
                        </span>
                      ) : formData.announcementEnabled === false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-200 text-neutral-700 border-2 border-neutral-700 text-[10px] font-black uppercase tracking-widest">
                          <Power className="w-3 h-3 text-neutral-500" />
                          Disabled (Hidden)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 border-2 border-amber-800 text-[10px] font-black uppercase tracking-widest">
                          No Text Set
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  {/* Master Toggle Control */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-2 border-black bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                        <span>Announcement Bar Visibility</span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {formData.announcementEnabled !== false
                          ? 'Active: Ticker is visible across all storefront pages.'
                          : 'Paused: Ticker is currently hidden from customers (message is preserved).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          announcementEnabled: prev.announcementEnabled === false ? true : false,
                        }))
                      }
                      className={`px-4 py-2 border-2 border-black font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 ${
                        formData.announcementEnabled !== false
                          ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                          : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{formData.announcementEnabled !== false ? 'Enabled (ON)' : 'Disabled (OFF)'}</span>
                    </button>
                  </div>

                  {/* Message Text Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="announcement" className="text-xs font-black uppercase tracking-wider">
                        Announcement Banner Text
                      </Label>
                      <span className="text-[10px] font-bold text-neutral-500">
                        {(formData.announcement || '').length} characters
                      </span>
                    </div>
                    <textarea
                      id="announcement"
                      name="announcement"
                      value={formData.announcement || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Complimentary shipping inside Dhaka on orders above ৳2,000!"
                      className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase placeholder:normal-case placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>

                  {/* Preset Template Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">
                      Quick Preset Ideas (Click to Apply):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Complimentary shipping inside Dhaka on orders above ৳2,000!',
                        '🔥 Special Offer: Use code FIRST10 for 10% off your first order!',
                        '⚡ New Arrivals: Raw Denim & Formal Pants Collection Live Now!',
                        '✨ 7-Day Hassle-Free Exchange Guarantee across Bangladesh',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, announcement: preset }))}
                          className="text-[10px] font-bold border border-black bg-white hover:bg-amber-100 px-2.5 py-1 text-left transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="announcementLink" className="text-xs font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-black" />
                        Clickable Target Link (Optional)
                      </span>
                      {formData.announcementLink && (
                        <a
                          href={formData.announcementLink.startsWith('http') ? formData.announcementLink : `http://localhost:3000${formData.announcementLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold normal-case"
                        >
                          Test Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </Label>
                    <Input
                      id="announcementLink"
                      name="announcementLink"
                      value={formData.announcementLink || ''}
                      onChange={handleChange}
                      placeholder="e.g. /shop?category=jeans or /shop or https://..."
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-neutral-500">
                      If provided, clicking the announcement banner on the storefront redirects visitors to this URL or internal route.
                    </p>
                  </div>

                  {/* Live Realistic Preview */}
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1.5 flex items-center justify-between">
                      <span>Live Storefront Ticker Preview:</span>
                      {formData.announcementEnabled === false && (
                        <span className="text-amber-700 font-bold">⚠️ Hidden on storefront while toggled OFF</span>
                      )}
                    </span>

                    <div className="border-2 border-black overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {formData.announcement ? (
                        <div
                          className={`py-2 px-4 flex items-center justify-center gap-2 text-center transition-opacity ${
                            formData.announcementEnabled !== false ? 'bg-black text-amber-300' : 'bg-neutral-800 text-neutral-400 opacity-60'
                          }`}
                        >
                          <Megaphone className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-amber-300" />
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            {formData.announcement}
                          </span>
                          {formData.announcementLink && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black underline uppercase text-white tracking-widest ml-1">
                              Explore <ArrowRight className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="bg-neutral-100 text-neutral-400 py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-wider">
                          Enter banner text above to see live preview
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storefront Logo Upload & Preview */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-black" />
                    Storefront Logo
                  </CardTitle>
                  <CardDescription>
                    Upload an image or specify an image URL for the storefront header
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Upload Drop Area */}
                  <div className="relative group border-2 border-dashed border-black bg-neutral-50 p-6 flex flex-col items-center justify-center min-h-[190px] overflow-hidden transition-colors hover:bg-neutral-100">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Storefront Logo Preview"
                          className="max-h-20 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLogo();
                          }}
                          title="Remove logo"
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 shadow-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto text-neutral-400" />
                        <div>
                          <p className="text-xs font-black uppercase text-black">No Logo Uploaded</p>
                          <p className="text-[10px] text-neutral-500">
                            The brand name text ({formData.title || 'Brand'}) is rendered instead
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Hover Upload Overlay */}
                    <label className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {isUploading ? (
                        <div className="flex flex-col items-center space-y-2 text-white">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-xs font-bold">Uploading file...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="text-white w-6 h-6 mb-1.5" />
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            {logoPreview ? 'Replace Logo' : 'Upload New Logo'}
                          </span>
                          <span className="text-[10px] text-neutral-300">Click to browse file</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleLogoUpload}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {/* Manual URL input fallback */}
                  <div className="space-y-1.5">
                    <Label htmlFor="logo" className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                      Or Direct Logo Image URL
                    </Label>
                    <Input
                      id="logo"
                      name="logo"
                      value={formData.logo}
                      onChange={(e) => {
                        handleChange(e);
                        setLogoPreview(e.target.value);
                      }}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="p-3 bg-neutral-100 border border-neutral-300 text-[11px] text-neutral-600 space-y-1">
                    <p className="font-bold text-black uppercase text-[10px]">Recommended Specifications:</p>
                    <p>• Format: Transparent PNG or SVG vector.</p>
                    <p>• Max display height: 40px (aspect ratio ~4:1 or 3:1 works best).</p>
                    <p>• Leave blank if you prefer bold typography text header.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTACT & OPERATIONS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Care Hotline & Email */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-black" />
                  Support Communication
                </CardTitle>
                <CardDescription>
                  Phone hotline and support email used across footer, policies, and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-black" />
                    Customer Support Phone / Hotline *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+880 1911-209322"
                    required
                  />
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Displayed on contact cards, WhatsApp fallback button, and printed order invoices.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-black" />
                    Official Support Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="support@domain.com"
                    required
                  />
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Displayed on the contact page, legal policy desks, and invoice correspondence.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessHours" className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-black" />
                    Operating Business Hours
                  </Label>
                  <Input
                    id="businessHours"
                    name="businessHours"
                    value={formData.businessHours || ''}
                    onChange={handleChange}
                    placeholder="10:00 AM – 08:00 PM (Daily)"
                  />
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Displayed in the footer contact column and the contact support desk.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Physical Address & Google Maps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-black" />
                  Store Location & Hub
                </CardTitle>
                <CardDescription>
                  Physical headquarters or pickup hub address and Google Maps integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                    Physical Store / Hub Address
                  </Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. House 12, Road 4, Sector 3, Uttara, Dhaka-1230"
                    className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase placeholder:normal-case placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Displayed in the footer, contact hub card, and return dispatch instructions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locationMapUrl" className="text-xs font-black uppercase tracking-wider">
                    Google Maps Embed URL
                  </Label>
                  <Input
                    id="locationMapUrl"
                    name="locationMapUrl"
                    value={formData.locationMapUrl || ''}
                    onChange={handleChange}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Paste the <code className="bg-neutral-100 px-1 font-bold">src</code> URL from Google Maps Embed.
                  </p>
                </div>

                {formData.locationMapUrl && (
                  <div className="border-2 border-black overflow-hidden bg-neutral-100">
                    <div className="bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                      Live Map Preview
                    </div>
                    <iframe
                      src={formData.locationMapUrl}
                      width="100%"
                      height="160"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SOCIAL MEDIA & CHANNELS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-black" />
              Social Media & Direct Channels
            </CardTitle>
            <CardDescription>
              Configure live links to your brand community and instant messaging channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WhatsApp */}
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    WhatsApp Business / Support Number
                  </Label>
                  {formData.socialLinks?.whatsapp && (
                    <a
                      href={`https://wa.me/${formData.socialLinks.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      Test Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  name="social.whatsapp"
                  value={formData.socialLinks?.whatsapp || ''}
                  onChange={handleChange}
                  placeholder="01911209322 or +8801911209322"
                />
                <p className="text-[10px] text-neutral-500 font-medium">
                  Used for one-click chat on the storefront navbar, footer, contact page, and returns desk.
                </p>
              </div>

              {/* Facebook */}
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook Page URL
                  </Label>
                  {formData.socialLinks?.facebook && (
                    <a
                      href={formData.socialLinks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Open Page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  name="social.facebook"
                  value={formData.socialLinks?.facebook || ''}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourbrand"
                />
                <p className="text-[10px] text-neutral-500 font-medium">
                  Linked directly in the storefront footer social media row.
                </p>
              </div>

              {/* Instagram */}
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram Profile URL
                  </Label>
                  {formData.socialLinks?.instagram && (
                    <a
                      href={formData.socialLinks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase text-pink-600 hover:underline flex items-center gap-1"
                    >
                      Open Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  name="social.instagram"
                  value={formData.socialLinks?.instagram || ''}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourbrand"
                />
                <p className="text-[10px] text-neutral-500 font-medium">
                  Linked directly in the storefront footer social media row.
                </p>
              </div>

              {/* YouTube */}
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                    <Youtube className="w-4 h-4 text-red-600" />
                    YouTube Channel URL
                  </Label>
                  {formData.socialLinks?.youtube && (
                    <a
                      href={formData.socialLinks.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase text-red-600 hover:underline flex items-center gap-1"
                    >
                      Open Channel <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  name="social.youtube"
                  value={formData.socialLinks?.youtube || ''}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourbrand"
                />
                <p className="text-[10px] text-neutral-500 font-medium">
                  Linked directly in the storefront footer social media row.
                </p>
              </div>

              {/* TikTok */}
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                    <span className="font-mono font-bold text-xs">TT</span>
                    TikTok Profile URL
                  </Label>
                  {formData.socialLinks?.tiktok && (
                    <a
                      href={formData.socialLinks.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase text-neutral-800 hover:underline flex items-center gap-1"
                    >
                      Open TikTok <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  name="social.tiktok"
                  value={formData.socialLinks?.tiktok || ''}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourbrand"
                />
                <p className="text-[10px] text-neutral-500 font-medium">
                  Linked directly in the storefront footer social media row.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STOREFRONT LIVE PREVIEW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-black" />
                    Live Storefront Rendering Preview
                  </CardTitle>
                  <CardDescription>
                    Real-time visual simulation of how header, ticker, and footer look with your current settings
                  </CardDescription>
                </div>
                <span className="bg-amber-400 text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Live Mockup
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Mockup 1: Top Announcement Bar & Navbar */}
              <div className="border-2 border-black overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-neutral-200 border-b border-black px-3 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-700">
                  <span>Browser View (Header & Navbar)</span>
                  <span>{formData.title} Storefront</span>
                </div>

                {/* Announcement Ticker */}
                {formData.announcementEnabled !== false && formData.announcement?.trim() ? (
                  <div className="bg-black text-amber-300 py-2 px-4 flex items-center justify-center gap-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-neutral-800">
                    <Megaphone className="h-3 w-3 text-amber-300 animate-pulse flex-shrink-0" />
                    <span>{formData.announcement}</span>
                    {formData.announcementLink && (
                      <span className="text-white underline ml-1 text-[9px] font-bold">
                        Explore →
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-100 text-neutral-400 py-1.5 px-4 text-center text-[9px] font-bold uppercase tracking-wider border-b border-neutral-300 border-dashed">
                    [ Announcement Ticker is currently disabled or empty ]
                  </div>
                )}

                {/* Navbar Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-neutral-200">
                  <div className="flex flex-col items-start gap-0.5">
                    {logoPreview ? (
                      <div className="h-8 w-auto">
                        <img src={logoPreview} alt={formData.title} className="h-full w-auto object-contain" />
                      </div>
                    ) : (
                      <>
                        <span className="text-xl font-black uppercase tracking-tighter text-black leading-none">
                          {formData.title || 'BRAND TITLE'}
                        </span>
                        {formData.tagline && (
                          <span className="text-[7.5px] font-medium italic tracking-[0.3em] text-neutral-400 uppercase leading-none mt-1">
                            {formData.tagline}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Sample Nav Links */}
                  <div className="hidden sm:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-black">
                    <span className="border-b-2 border-black pb-0.5">Jeans</span>
                    <span className="text-neutral-500">Twill</span>
                    <span className="text-neutral-500">Formal</span>
                    <span className="text-neutral-500">Shop All</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border-2 border-black bg-neutral-100 flex items-center justify-center text-[10px] font-black">
                      🛒
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup 2: Footer */}
              <div className="border-2 border-black overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-neutral-200 border-b border-black px-3 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-700">
                  <span>Browser View (Footer)</span>
                  <span>Storefront Bottom Section</span>
                </div>

                <div className="bg-black text-neutral-300 p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Brand */}
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                        {formData.title || 'BRAND TITLE'}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {formData.tagline || 'Engineered for exceptional comfort and lasting durability.'}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 text-xs text-neutral-300">
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">Direct Contact:</p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{formData.phone || '+8801700000000'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{formData.email || 'support@domain.com'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{formData.address || 'Dhaka, Bangladesh'}</span>
                      </p>
                    </div>

                    {/* Socials & Hours */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">Operating Hours:</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{formData.businessHours || '10:00 AM – 08:00 PM'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                    <p>&copy; {new Date().getFullYear()} {formData.title || 'Brand'}. All rights reserved.</p>
                    <span>Nationwide Delivery in Bangladesh</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white border-2 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="text-xs font-black uppercase text-amber-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              You have unsaved changes
            </span>
          ) : (
            <span className="text-xs font-black uppercase text-neutral-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All configurations saved
            </span>
          )}
          <span className="hidden sm:inline-block text-[10px] text-neutral-400 font-mono">
            (Shortcut: Ctrl+S)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="h-10 px-6 bg-black text-white hover:bg-neutral-800 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] disabled:opacity-40"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
