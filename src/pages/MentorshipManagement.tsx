import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Eye, Link as LinkIcon, XCircle, UserCheck, CheckCircle, Clock as ClockIcon, Save } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const MentorshipManagement: React.FC = () => {
    const [mentorships, setMentorships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMentorship, setSelectedMentorship] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchMentorships();
    }, []);

    const fetchMentorships = async () => {
        setLoading(true);
        try {
            // We'll define "Mentorship" as a Senior/Alumni answering a Junior's question
            const { data, error } = await supabase
                .from('answers')
                .select(`
                    id,
                    content,
                    created_at,
                    is_accepted,
                    author:users!author_id(full_name, role),
                    question:questions!question_id(
                        title,
                        asker:users!author_id(full_name, role)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped = data.map(a => ({
                    id: a.id,
                    mentor: a.author?.full_name || 'System',
                    mentee: a.question?.asker?.full_name || 'System',
                    connectionDate: a.created_at,
                    lastInteraction: a.created_at,
                    status: a.is_accepted ? 'Completed' : 'Active',
                    topic: a.question?.title || 'General Discussion',
                    mentorRole: a.author?.role,
                    menteeRole: a.question?.asker?.role
                }));
                setMentorships(mapped);
            }
        } catch (error: any) {
            showToast(error.message || 'Error fetching mentorship data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEndConnection = async (mentorship: any) => {
        if (confirm(`Are you sure you want to end the mentorship session regarding "${mentorship.topic}"? This will remove the recorded interaction.`)) {
            try {
                const { error } = await supabase
                    .from('answers')
                    .delete()
                    .eq('id', mentorship.id);

                if (error) throw error;

                showToast('Mentorship connection ended successfully', 'success');
                setIsModalOpen(false);
                fetchMentorships();
            } catch (error: any) {
                showToast(error.message || 'Failed to end connection', 'error');
            }
        }
    };

    const columns = [
        {
            key: 'mentor',
            label: 'Mentor',
            render: (m: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-medium">{m.mentor.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{m.mentor}</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase">{m.mentorRole}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'mentee',
            label: 'Mentee',
            render: (m: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">{m.mentee.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{m.mentee}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{m.menteeRole}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'topic',
            label: 'Topic',
            render: (m: any) => <span className="text-sm text-gray-600 truncate max-w-[150px] inline-block">{m.topic}</span>
        },
        {
            key: 'connectionDate',
            label: 'Date',
            render: (m: any) => formatDate(m.connectionDate),
        },
        {
            key: 'status',
            label: 'Status',
            render: (m: any) => <StatusBadge variant={m.status} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (m: any) => (
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
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mentorship Activity</h1>
                    <p className="text-gray-600 mt-1">Monitor all mentorship interactions across the platform</p>
                </div>
                <button 
                    onClick={fetchMentorships}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Sessions"
                    value={mentorships.filter(m => m.status === 'Active').length}
                    icon={UserCheck}
                />
                <StatCard
                    title="Solved Issues"
                    value={mentorships.filter(m => m.status === 'Completed').length}
                    icon={CheckCircle}
                />
                <StatCard
                    title="Total Interactions"
                    value={mentorships.length}
                    icon={ClockIcon}
                />
            </div>

            {/* Data Table */}
            <DataTable
                data={mentorships}
                columns={columns}
                searchPlaceholder="Search by mentor or mentee..."
                emptyMessage="No mentorship activity found"
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
