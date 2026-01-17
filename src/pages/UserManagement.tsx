import React, { useState } from 'react';
import { MoreVertical, Eye, UserCheck, UserX, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { mockUsers } from '@/data/mockData';
import { User, UserType } from '@/types';
import { formatDate } from '@/lib/utils';

const UserManagement: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'All' | UserType>('All');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const filteredUsers = selectedTab === 'All'
        ? mockUsers
        : mockUsers.filter(user => user.userType === selectedTab);

    const handleActivate = (user: User) => {
        showToast(`User ${user.name} has been activated`, 'success');
    };

    const handleDeactivate = (user: User) => {
        showToast(`User ${user.name} has been deactivated`, 'warning');
    };

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            showToast(`User ${user.name} has been deleted`, 'success');
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">{user.name.charAt(0)}</span>
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
            key: 'department',
            label: 'Department',
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage all users on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{mockUsers.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Juniors</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {mockUsers.filter(u => u.userType === 'Junior').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Seniors</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                        {mockUsers.filter(u => u.userType === 'Senior').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Alumni</p>
                    <p className="text-2xl font-bold text-violet-600 mt-1">
                        {mockUsers.filter(u => u.userType === 'Alumni').length}
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
            <DataTable
                data={filteredUsers}
                columns={columns}
                searchPlaceholder="Search by name or email..."
                emptyMessage="No users found"
            />

            {/* User Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="User Details"
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl text-primary-700 font-bold">
                                    {selectedUser.name.charAt(0)}
                                </span>
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
                            <button className="btn-primary flex-1">Send Message</button>
                            <button
                                onClick={() => {
                                    selectedUser.status === 'Active' ? handleDeactivate(selectedUser) : handleActivate(selectedUser);
                                    setIsModalOpen(false);
                                }}
                                className="btn-secondary flex-1"
                            >
                                {selectedUser.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
