'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { UserItem } from '@/lib/api-types';

export default function UsersDirectoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-users', page, keyword],
    queryFn: async () => {
      const res = await usersApi.getAll({ page, limit: 10, keyword: keyword || undefined });
      return res.data;
    },
  });

  const users = response?.data || [];
  const pagination = response?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User account removed');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-4 border-black pb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
          Identity Management
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
          User Directory
        </h1>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <SearchInput
          placeholder="SEARCH BY NAME, EMAIL, OR PHONE NUMBER..."
          onDebouncedChange={(val) => {
            setKeyword(val);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Table */}
      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase text-[10px] font-black tracking-wider">
              <th className="p-4 border-r border-neutral-700">User Identity</th>
              <th className="p-4 border-r border-neutral-700">Contact / Address</th>
              <th className="p-4 border-r border-neutral-700">Role</th>
              <th className="p-4 border-r border-neutral-700">Orders / Spent</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading Personnel Records...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-neutral-400 font-bold uppercase">
                  No user accounts found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-black uppercase text-black">{u.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{u.email}</p>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-bold">{u.phone || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                      {u.address || 'No saved address'}
                    </p>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase ${
                        u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                          ? 'bg-black text-white'
                          : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {(u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') && <Shield className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4 border-r border-neutral-200">
                    <p className="font-black text-black">{u.orderCount} Orders</p>
                    <p className="text-[10px] text-neutral-400">
                      Spent: {formatPrice(u.totalSpent || 0)}
                    </p>
                  </td>

                  <td className="p-4 text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteTarget(u)}
                      disabled={u.role === 'SUPER_ADMIN'}
                      className="h-8 w-8"
                      title="Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Total {pagination.total} registered users
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

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Revoke User Access"
        description={`Are you sure you want to remove user "${deleteTarget?.name}" (${deleteTarget?.email})?`}
        confirmLabel="Remove User"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
