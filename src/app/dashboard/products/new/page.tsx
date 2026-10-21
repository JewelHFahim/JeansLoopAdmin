'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { ProductForm } from '@/components/forms/ProductForm';
import { toast } from 'sonner';
import type { Product } from '@/lib/api-types';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productsApi.create(data),
    onSuccess: () => {
      toast.success('Product created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      router.push('/dashboard/products');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product');
    },
  });

  return (
    <ProductForm
      title="Create New Product Asset"
      isSubmitting={createMutation.isPending}
      onSubmit={async (data) => {
        await createMutation.mutateAsync(data);
      }}
    />
  );
}
