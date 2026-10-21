'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { ProductForm } from '@/components/forms/ProductForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/api-types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productsApi.getById(id);
      return response.data;
    },
  });

  const product = res?.data;

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      router.push('/dashboard/products');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update product');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 border-2 border-black bg-white text-center">
        <p className="font-bold uppercase text-xs">Product Not Found</p>
      </div>
    );
  }

  return (
    <ProductForm
      initialData={product}
      title={`Update Asset: ${product.name}`}
      isSubmitting={updateMutation.isPending}
      onSubmit={async (data) => {
        await updateMutation.mutateAsync(data);
      }}
    />
  );
}
