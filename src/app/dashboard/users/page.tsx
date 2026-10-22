'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchInput } from '@/components/tables/SearchInput';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import {
  Trash2,
  Loader2,
  Shield,
  ShieldCheck,
  UserPlus,
  KeyRound,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UserItem } from '@/lib/api-types';

const AVAILABLE_PERMISSIONS = [
  { id: 'orders', label: 'Orders & Invoices', desc: 'Process orders, update status, and print slips' },
  { id: 'products', label: 'Products & Inventory', desc: 'Add/edit items, stock levels, and pricing' },
  { id: 'categories', label: 'Categories', desc: 'Create and organize product categories' },
  { id: 'coupons', label: 'Coupons & Discounts', desc: 'Manage promotional coupons and discount codes' },
  { id: 'sliders', label: 'Hero Sliders', desc: 'Update homepage hero banners and promotions' },
  { id: 'settings', label: 'Site Settings', desc: 'Configure store contacts, address, and hours' },
  { id: 'dashboard', label: 'Command Center', desc: 'View sales statistics and dashboard charts' },
] as const;

export default function UsersDirectoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState<string>('');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Add Staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'MANAGER',
    permissions: ['orders', 'products'] as string[],
  });

  // Edit Permissions form state
  const [editRole, setEditRole] = useState('MANAGER');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentAdminId(parsed._id || parsed.id || '');
      }
    } catch {
      // Ignore
    }
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-users', page, keyword],
    queryFn: async () => {
      const res = await usersApi.getAll({ page, limit: 10, keyword: keyword || undefined });
      return res.data;
    },
  });

  const users = response?.data || [];
  const pagination = response?.pagination;

  // Mutations
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

  const createStaffMutation = useMutation({
    mutationFn: (data: typeof newStaff) => usersApi.create(data),
    onSuccess: () => {
      toast.success('New staff member added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddStaffOpen(false);
      setNewStaff({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'MANAGER',
        permissions: ['orders', 'products'],
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create staff account');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role, permissions }: { id: string; role: string; permissions: string[] }) =>
      usersApi.updateRole(id, { role, permissions }),
    onSuccess: () => {
      toast.success('User role and access permissions updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update access control');
    },
  });

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditRole(user.role || 'MANAGER');
    setEditPermissions(user.permissions && user.permissions.length > 0 ? user.permissions : ['orders', 'products']);
  };

  const handleToggleNewPerm = (permId: string) => {
    setNewStaff((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId],
      };
    });
  };

  const handleToggleEditPerm = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-black pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">
            Access Control & Personnel
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black leading-none">
            User Directory
          </h1>
        </div>

        <Button
          onClick={() => setIsAddStaffOpen(true)}
          className="gap-2 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs tracking-wider"
        >
          <UserPlus className="h-4 w-4" /> Add Staff / Manager
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <SearchInput
          placeholder="SEARCH BY NAME, EMAIL, OR PHONE..."
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
              <th className="p-4 border-r border-neutral-700">Role & Access Scope</th>
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
              users.map((u) => {
                const isSuperOrAdmin = u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
                const isManager = u.role === 'MANAGER' || u.role === 'STAFF';
                const isSelf = u._id === currentAdminId;

                return (
                  <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                    {/* Identity */}
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black uppercase text-black">{u.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{u.email}</p>
                    </td>

                    {/* Contact */}
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-bold">{u.phone || 'N/A'}</p>
                      <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                        {u.address || 'No saved address'}
                      </p>
                    </td>

                    {/* Role & Access Scope */}
                    <td className="p-4 border-r border-neutral-200">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            isSuperOrAdmin
                              ? 'bg-black text-white border-black'
                              : isManager
                              ? 'bg-neutral-800 text-white border-black'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {isSuperOrAdmin ? (
                            <ShieldCheck className="h-3 w-3 text-white" />
                          ) : isManager ? (
                            <Shield className="h-3 w-3 text-neutral-300" />
                          ) : null}
                          {isSuperOrAdmin
                            ? 'Primary Administrator'
                            : isManager
                            ? 'Staff / Manager'
                            : 'Customer'}
                        </span>

                        {isManager && (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.permissions && u.permissions.length > 0 ? (
                              u.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="text-[8px] bg-neutral-100 border border-neutral-300 px-1 py-0.2 font-mono uppercase text-neutral-700"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-red-500 italic font-normal">
                                No permissions granted
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Orders / Spent */}
                    <td className="p-4 border-r border-neutral-200">
                      <p className="font-black text-black">{u.orderCount} Orders</p>
                      <p className="text-[10px] text-neutral-400">
                        Spent: {formatPrice(u.totalSpent || 0)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Access Control */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 gap-1.5 text-[10px] font-black uppercase"
                          title="Manage Access Control"
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Access
                        </Button>

                        {/* Delete User */}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteTarget(u)}
                          disabled={u.role === 'SUPER_ADMIN' || isSelf}
                          className="h-8 w-8"
                          title={isSelf ? 'Cannot delete yourself' : 'Delete User'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-xs font-bold uppercase text-neutral-500">
            Total {pagination.total} registered personnel
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

      {/* Modal 1: Create Staff Member */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-white border-4 border-black p-6 md:p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] space-y-6 my-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-black" />
                <h2 className="text-xl font-black uppercase italic tracking-tight">
                  Add New Staff / Manager
                </h2>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 hover:bg-neutral-100 border border-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStaffMutation.mutate(newStaff);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-name">Full Name *</Label>
                  <Input
                    id="staff-name"
                    placeholder="e.g. Tanvir Ahmed"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staff-email">Email Address *</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@jeansloop.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-pass">Password (Min 8 chars) *</Label>
                  <Input
                    id="staff-pass"
                    type="password"
                    placeholder="••••••••"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staff-phone">Phone Number (Optional)</Label>
                  <Input
                    id="staff-phone"
                    placeholder="01XXXXXXXXX"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5 border-t border-black/15 pt-3">
                <Label htmlFor="staff-role">Assign Role *</Label>
                <select
                  id="staff-role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="flex h-11 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  <option value="MANAGER">MANAGER (Staff - Controlled Access)</option>
                  <option value="ADMIN">ADMIN (Full Administrator Access)</option>
                </select>
                <p className="text-[10px] text-neutral-500 font-medium">
                  {newStaff.role === 'ADMIN'
                    ? 'Admins have unrestricted access to all dashboard functions and user management.'
                    : 'Managers only have access to the specific modules checked below.'}
                </p>
              </div>

              {/* Permissions Checklist (when MANAGER) */}
              {newStaff.role === 'MANAGER' && (
                <div className="border-2 border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-black/15 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      Module Access Permissions
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewStaff({
                            ...newStaff,
                            permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
                          })
                        }
                        className="text-[10px] font-bold uppercase underline hover:text-black"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewStaff({ ...newStaff, permissions: [] })}
                        className="text-[10px] font-bold uppercase underline hover:text-red-600"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = newStaff.permissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className="flex items-start gap-2.5 p-2 bg-white border border-neutral-300 hover:border-black cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleNewPerm(perm.id)}
                            className="mt-0.5 h-4 w-4 rounded-none accent-black cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase text-black">{perm.label}</p>
                            <p className="text-[10px] text-neutral-500 leading-tight">{perm.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-black/15">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddStaffOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createStaffMutation.isPending}
                  className="bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs"
                >
                  {createStaffMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Access Control */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-white border-4 border-black p-6 md:p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] space-y-6 my-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight">
                  Access Control: {editingUser.name}
                </h2>
                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-neutral-100 border border-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateRoleMutation.mutate({
                  id: editingUser._id,
                  role: editRole,
                  permissions: editRole === 'MANAGER' || editRole === 'STAFF' ? editPermissions : [],
                });
              }}
              className="space-y-4"
            >
              {/* Role Select */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-role">System Role *</Label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="flex h-11 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  <option value="MANAGER">MANAGER (Staff - Controlled Access)</option>
                  <option value="ADMIN">ADMIN (Full Administrator)</option>
                  <option value="CUSTOMER">CUSTOMER (Regular Store User)</option>
                </select>
              </div>

              {/* Permissions Checklist (when MANAGER) */}
              {(editRole === 'MANAGER' || editRole === 'STAFF') && (
                <div className="border-2 border-black p-4 bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-black/15 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      Module Access Permissions
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPermissions(AVAILABLE_PERMISSIONS.map((p) => p.id))}
                        className="text-[10px] font-bold uppercase underline hover:text-black"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPermissions([])}
                        className="text-[10px] font-bold uppercase underline hover:text-red-600"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = editPermissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className="flex items-start gap-2.5 p-2 bg-white border border-neutral-300 hover:border-black cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEditPerm(perm.id)}
                            className="mt-0.5 h-4 w-4 rounded-none accent-black cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase text-black">{perm.label}</p>
                            <p className="text-[10px] text-neutral-500 leading-tight">{perm.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-black/15">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateRoleMutation.isPending}
                  className="bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs"
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </Button>
              </div>
            </form>
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
