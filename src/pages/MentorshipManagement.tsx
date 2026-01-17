import React, { useState } from 'react';
import { Eye, Link as LinkIcon, XCircle } from 'lucide-react';
import { UserCheck, CheckCircle, Clock as ClockIcon } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { mockMentorships } from '@/data/mockData';
import { MentorshipConnection } from '@/types';
import { formatDate } from '@/lib/utils';

const MentorshipManagement: React.FC = () => {
    const [selectedMentorship, setSelectedMentorship] = useState<MentorshipConnection | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const handleEndConnection = (mentorship: MentorshipConnection) => {
        if (confirm(`Are you sure you want to end the mentorship between ${mentorship.mentor} and ${mentorship.mentee}?`)) {
            showToast('Mentorship connection has been ended', 'warning');
            setIsModalOpen(false);
        }
    };

    const columns = [
        {
            key: 'mentor',
            label: 'Mentor',
            render: (m: MentorshipConnection) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-medium">{m.mentor.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-gray-900">{m.mentor}</span>
                </div>
            ),
        },
        {
            key: 'mentee',
            label: 'Mentee',
            render: (m: MentorshipConnection) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">{m.mentee.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-gray-900">{m.mentee}</span>
                </div>
            ),
        },
        {
            key: 'connectionDate',
            label: 'Connection Date',
            render: (m: MentorshipConnection) => formatDate(m.connectionDate),
        },
        {
            key: 'status',
            label: 'Status',
            render: (m: MentorshipConnection) => <StatusBadge variant={m.status} />,
        },
        {
            key: 'lastInteraction',
            label: 'Last Interaction',
            render: (m: MentorshipConnection) => formatDate(m.lastInteraction),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (m: MentorshipConnection) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedMentorship(m);
                            setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    {m.status === 'Active' && (
                        <button
                            onClick={() => handleEndConnection(m)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="End Connection"
                        >
                            <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Mentorship Connections</h1>
                <p className="text-gray-600 mt-1">Monitor and manage mentorship relationships</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Pairs"
                    value={mockMentorships.filter(m => m.status === 'Active').length}
                    icon={UserCheck}
                />
                <StatCard
                    title="Completed"
                    value={mockMentorships.filter(m => m.status === 'Completed').length}
                    icon={CheckCircle}
                />
                <StatCard
                    title="Pending Requests"
                    value={mockMentorships.filter(m => m.status === 'Pending').length}
                    icon={ClockIcon}
                />
            </div>

            {/* Data Table */}
            <DataTable
                data={mockMentorships}
                columns={columns}
                searchPlaceholder="Search mentorships..."
                emptyMessage="No mentorship connections found"
            />

            {/* Mentorship Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Mentorship Details"
                size="lg"
            >
                {selectedMentorship && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl text-indigo-700 font-bold">
                                        {selectedMentorship.mentor.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Mentor</p>
                                    <p className="font-semibold text-gray-900">{selectedMentorship.mentor}</p>
                                </div>
                            </div>

                            <LinkIcon className="w-6 h-6 text-primary-500" />

                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 text-right">Mentee</p>
                                    <p className="font-semibold text-gray-900">{selectedMentorship.mentee}</p>
                                </div>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl text-blue-700 font-bold">
                                        {selectedMentorship.mentee.charAt(0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-gray-600">Connection Date</p>
                                <p className="font-medium text-gray-900">{formatDate(selectedMentorship.connectionDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Interaction</p>
                                <p className="font-medium text-gray-900">{formatDate(selectedMentorship.lastInteraction)}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Status</p>
                                <div className="mt-1">
                                    <StatusBadge variant={selectedMentorship.status} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-semibold text-gray-900 mb-3">Activity Timeline</h4>
                            <div className="space-y-3">
                                {[
                                    { date: selectedMentorship.lastInteraction, event: 'Last meeting scheduled' },
                                    { date: selectedMentorship.connectionDate, event: 'Mentorship connection established' },
                                ].map((activity, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="text-sm text-gray-900">{activity.event}</p>
                                            <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedMentorship.status === 'Active' && (
                            <div className="flex gap-3 pt-4">
                                <button className="btn-primary flex-1">Send Message</button>
                                <button
                                    onClick={() => handleEndConnection(selectedMentorship)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex-1"
                                >
                                    End Connection
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MentorshipManagement;
