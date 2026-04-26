import React, { useState, useEffect } from 'react';
import { Eye, UserCheck, UserX, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { User, UserType } from '@/types';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'All' | UserType>('All');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        role: '' as UserType
    });
    const { showToast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedUsers: User[] = data.map((u: any) => ({
                    id: u.id,
                    name: u.full_name,
                    email: u.email,
                    userType: (u.role?.charAt(0).toUpperCase() + u.role?.slice(1).toLowerCase()) as UserType || 'Junior',
                    department: u.bio?.includes('Dept:') ? u.bio.split('Dept:')[1].split('\n')[0].trim() : 'General',
                    status: u.deleted_at ? 'Inactive' : 'Active',
                    joinDate: u.created_at,
                    avatar: u.avatar_url || ''
                }));
                setUsers(mappedUsers);
            }
        } catch (error: any) {
            showToast(error.message || 'Error fetching users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: editForm.full_name,
                    email: editForm.email,
                    role: editForm.role,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            showToast('User updated successfully', 'success');
            setIsEditing(false);
            fetchUsers();
        } catch (error: any) {
            showToast(error.message || 'Error updating user', 'error');
        }
    };

    const handleActivate = async (user: User) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ deleted_at: null })
                .eq('id', user.id);

            if (error) throw error;

            showToast(`User ${user.name} has been activated`, 'success');
            fetchUsers();
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.message || 'Error activating user', 'error');
        }
    };

    const handleDeactivate = async (user: User) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            showToast(`User ${user.name} has been deactivated`, 'warning');
            fetchUsers();
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.message || 'Error deactivating user', 'error');
        }
    };

    const handleDelete = async (user: User) => {
        if (confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone. Note: If this user has participated in the app (created skills, chats, etc.), you should use "Deactivate" instead to avoid database errors.`)) {
            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', user.id);

                if (error) {
                    if (error.code === '23503') {
                        throw new Error(`Cannot delete user: ${user.name} has active data (skills, chats, etc.). Please "Deactivate" the user instead to disable their account safely.`);
                    }
                    throw error;
                }

                showToast(`User ${user.name} has been permanently deleted`, 'success');
                fetchUsers();
                setIsModalOpen(false);
            } catch (error: any) {
                showToast(error.message || 'Error deleting user', 'error');
            }
        }
    };

    const filteredUsers = selectedTab === 'All'
        ? users
        : users.filter(user => user.userType === selectedTab);

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary-700 font-medium">{user.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'userType',
            label: 'User Type',
            render: (user: User) => <StatusBadge variant={user.userType} />,
        },
        {
            key: 'status',
            label: 'Status',
            render: (user: User) => <StatusBadge variant={user.status} />,
        },
        {
            key: 'joinDate',
            label: 'Join Date',
            render: (user: User) => formatDate(user.joinDate),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user: User) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Profile"
                    >
                        <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                        onClick={() => user.status === 'Active' ? handleDeactivate(user) : handleActivate(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                        {user.status === 'Active' ? (
                            <UserX className="w-4 h-4 text-orange-600" />
                        ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                        )}
                    </button>
                    <button
                        onClick={() => handleDelete(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Manage all users on the platform</p>
                </div>
                <button 
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Juniors</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {users.filter(u => u.userType === 'Junior').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Seniors</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                        {users.filter(u => u.userType === 'Senior').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Alumni</p>
                    <p className="text-2xl font-bold text-violet-600 mt-1">
                        {users.filter(u => u.userType === 'Alumni').length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {['All', 'Junior', 'Senior', 'Alumni'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab as typeof selectedTab)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${selectedTab === tab
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                    <p className="text-gray-500">Loading users...</p>
                </div>
            ) : (
                <DataTable
                    data={filteredUsers}
                    columns={columns}
                    searchPlaceholder="Search by name or email..."
                    emptyMessage="No users found"
                />
            )}

            {/* User Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditing(false);
                }}
                title={isEditing ? 'Edit User' : 'User Details'}
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        {!isEditing ? (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-primary-700 font-bold">
                                                {selectedUser.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                                        <p className="text-gray-600">{selectedUser.email}</p>
                                        <div className="flex gap-2 mt-2">
                                            <StatusBadge variant={selectedUser.userType} />
                                            <StatusBadge variant={selectedUser.status} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-gray-600">Department</p>
                                        <p className="font-medium text-gray-900">{selectedUser.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Join Date</p>
                                        <p className="font-medium text-gray-900">{formatDate(selectedUser.joinDate)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => {
                                            setEditForm({
                                                full_name: selectedUser.name,
                                                email: selectedUser.email,
                                                role: selectedUser.userType
                                            });
                                            setIsEditing(true);
                                        }}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-1 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            selectedUser.status === 'Active' ? handleDeactivate(selectedUser) : handleActivate(selectedUser);
                                        }}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1 transition-colors"
                                    >
                                        {selectedUser.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedUser)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex-shrink-0 transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="input-field" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="input-field" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select 
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserType })}
                                        className="input-field"
                                    >
                                        <option value="Junior">Junior</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Alumni">Alumni</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-1"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
