'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { settingsApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SiteSettings } from '@/lib/api-types';

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<SiteSettings>({
    title: 'JeansLoop',
    tagline: 'Premium Denim & Fashionwear',
    logo: '',
    email: 'support@jeansloop.com',
    phone: '+8801700000000',
    address: 'Dhaka, Bangladesh',
    locationMapUrl: '',
    businessHours: 'Sat - Thu, 10am - 8pm',
    announcement: 'Free delivery on orders over ৳3,000!',
    socialLinks: {
      facebook: '',
      instagram: '',
      youtube: '',
      whatsapp: '',
      tiktok: '',
    },
  });

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await settingsApi.get();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settingsRes) {
      setFormData({
        title: settingsRes.title || 'JeansLoop',
        tagline: settingsRes.tagline || '',
        logo: settingsRes.logo || '',
        email: settingsRes.email || '',
        phone: settingsRes.phone || '',
        address: settingsRes.address || '',
        locationMapUrl: settingsRes.locationMapUrl || '',
        businessHours: settingsRes.businessHours || '',
        announcement: settingsRes.announcement || '',
        socialLinks: {
          facebook: settingsRes.socialLinks?.facebook || '',
          instagram: settingsRes.socialLinks?.instagram || '',
          youtube: settingsRes.socialLinks?.youtube || '',
          whatsapp: settingsRes.socialLinks?.whatsapp || '',
          tiktok: settingsRes.socialLinks?.tiktok || '',
        },
      });
      if (settingsRes.logo) {
        setLogoPreview(settingsRes.logo);
      }
    }
  }, [settingsRes]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SiteSettings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Site configurations updated successfully!');
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
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm font-semibold text-muted-foreground">
          Loading site configurations...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Site Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Manage global store identity, brand logo, contact channels, and social media connectivity.
          </p>
        </div>
        <Button type="submit" disabled={updateMutation.isPending} className="self-start sm:self-auto">
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Branding & Announcements (Left column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Store Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40 flex items-center justify-center relative overflow-hidden group">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Site Logo"
                      className="max-h-full max-w-full object-contain p-3"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, logo: '' }));
                        setLogoPreview('');
                      }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow hover:opacity-90 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Globe className="w-8 h-8 mx-auto text-muted-foreground/50 mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">No logo loaded</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <>
                      <Upload className="text-white w-6 h-6 mb-1" />
                      <span className="text-xs text-white font-medium">Upload new logo</span>
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
              <p className="text-xs text-muted-foreground text-center">
                Recommended: Transparent PNG or SVG (aspect ratio 4:1 or square).
              </p>
            </CardContent>
          </Card>

          {/* Announcement Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Top Announcement Bar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="announcement" className="text-xs">
                  Banner Text
                </Label>
                <textarea
                  id="announcement"
                  name="announcement"
                  value={formData.announcement || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. 50% Eid Mega Sale is live now! Use code EID50"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the top ticker banner across the storefront.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Settings & Social Links (Right 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                General Identity & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="title">Brand Name / Platform Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="JeansLoop"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="tagline">Tagline / Slogan</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    value={formData.tagline || ''}
                    onChange={handleChange}
                    placeholder="Premium Denim & Everyday Essentials"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Public Support Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="support@jeansloop.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Customer Support Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="+880 1700-000000"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Store / Office Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="House 12, Road 4, Banani, Dhaka-1213, Bangladesh"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessHours" className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Business Hours
                  </Label>
                  <Input
                    id="businessHours"
                    name="businessHours"
                    value={formData.businessHours || ''}
                    onChange={handleChange}
                    placeholder="Sat - Thu: 10:00 AM - 8:00 PM"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locationMapUrl">Google Maps Embed URL</Label>
                  <Input
                    id="locationMapUrl"
                    name="locationMapUrl"
                    value={formData.locationMapUrl || ''}
                    onChange={handleChange}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                Social Media & Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    Facebook Page URL
                  </Label>
                  <Input
                    name="social.facebook"
                    value={formData.socialLinks?.facebook || ''}
                    onChange={handleChange}
                    placeholder="https://facebook.com/jeansloop"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    Instagram Profile URL
                  </Label>
                  <Input
                    name="social.instagram"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/jeansloop"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    YouTube Channel URL
                  </Label>
                  <Input
                    name="social.youtube"
                    value={formData.socialLinks?.youtube || ''}
                    onChange={handleChange}
                    placeholder="https://youtube.com/@jeansloop"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    WhatsApp Support Number / Link
                  </Label>
                  <Input
                    name="social.whatsapp"
                    value={formData.socialLinks?.whatsapp || ''}
                    onChange={handleChange}
                    placeholder="+8801700000000"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[11px]">TikTok</span>
                    TikTok Profile URL
                  </Label>
                  <Input
                    name="social.tiktok"
                    value={formData.socialLinks?.tiktok || ''}
                    onChange={handleChange}
                    placeholder="https://tiktok.com/@jeansloop"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
