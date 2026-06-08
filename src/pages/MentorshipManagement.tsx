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
            // 1. Fetch Q&A Mentorships (Answers)
            const { data: answersData, error: answersError } = await supabase
                .from('answers')
                .select(`
                    id,
                    content,
                    created_at,
                    is_accepted,
                    author:users!author_id(full_name, role, avatar_url),
                    question:questions!question_id(
                        title,
                        asker:users!author_id(full_name, role, avatar_url)
                    )



                `)
                .order('created_at', { ascending: false });

            if (answersError) throw answersError;

            // 2. Fetch Swap Connections (Matches)
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select(`
                    id,
                    matched_at,
                    user1:users!user_id(id, full_name, role, avatar_url),
                    user2:users!matched_user_id(id, full_name, role, avatar_url)



                `)
                .order('matched_at', { ascending: false });



            if (matchesError) throw matchesError;

            // 3. Map and Combine
            const qas = (answersData || []).map(a => ({
                id: a.id,
                type: 'QA Mentorship',
                mentor: a.author?.full_name || 'System',
                mentee: a.question?.asker?.full_name || 'System',
                mentorAvatar: a.author?.avatar_url,
                menteeAvatar: a.question?.asker?.avatar_url,
                connectionDate: a.created_at,



                lastInteraction: a.created_at,
                status: a.is_accepted ? 'Completed' : 'Active',
                topic: a.question?.title || 'General Discussion',
                mentorRole: a.author?.role,
                menteeRole: a.question?.asker?.role,
                details: a.content
            }));

            const swaps = (matchesData || []).map(m => ({
                id: m.id,
                type: 'Swap Match',
                mentor: m.user1?.full_name || 'User A',
                mentee: m.user2?.full_name || 'User B',
                mentorId: (m.user1 as any)?.id,
                menteeId: (m.user2 as any)?.id,
                mentorAvatar: (m.user1 as any)?.avatar_url,
                menteeAvatar: (m.user2 as any)?.avatar_url,
                connectionDate: m.matched_at,




                lastInteraction: m.matched_at,
                status: 'Active',

                topic: 'Peer Collaboration',
                mentorRole: m.user1?.role,
                menteeRole: m.user2?.role,
                details: 'Connection made via Find Collaborator'
            }));

            const combined = [...qas, ...swaps].sort((a, b) => 
                new Date(b.connectionDate).getTime() - new Date(a.connectionDate).getTime()
            );

            setMentorships(combined);
        } catch (error: any) {
            showToast(error.message || 'Error fetching mentorship data', 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleEndConnection = async (mentorship: any) => {
        if (confirm(`Are you sure you want to end the mentorship session regarding "${mentorship.topic}"? This will remove the recorded interaction.`)) {
            try {
                const table = mentorship.type === 'Swap Match' ? 'matches' : 'answers';
                
                // If it's a Swap Match, we also need to clear swipe_actions so they can match again
                if (mentorship.type === 'Swap Match' && mentorship.mentorId && mentorship.menteeId) {
                    await supabase
                        .from('swipe_actions')
                        .delete()
                        .or(`and(actor_id.eq.${mentorship.mentorId},target_id.eq.${mentorship.menteeId}),and(actor_id.eq.${mentorship.menteeId},target_id.eq.${mentorship.mentorId})`);
                    
                    console.log('Cleared swipe actions for users:', mentorship.mentorId, mentorship.menteeId);
                }

                const { error } = await supabase
                    .from(table)
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
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                        {m.mentorAvatar ? (
                            <img src={m.mentorAvatar} alt={m.mentor} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-indigo-700 font-medium">{m.mentor.charAt(0)}</span>
                        )}
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
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {m.menteeAvatar ? (
                            <img src={m.menteeAvatar} alt={m.mentee} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-blue-700 font-medium">{m.mentee.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{m.mentee}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{m.menteeRole}</p>
                    </div>
                </div>
            ),
        },

        {
            key: 'type',
            label: 'Type',
            render: (m: any) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    m.type === 'Swap Match' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                }`}>
                    {m.type}
                </span>
            )
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    title="Active Sessions"
                    value={mentorships.filter(m => m.status === 'Active').length}
                    icon={UserCheck}
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
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {selectedMentorship.mentorAvatar ? (
                                        <img src={selectedMentorship.mentorAvatar} alt="Mentor" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-indigo-700 font-bold">
                                            {selectedMentorship.mentor.charAt(0)}
                                        </span>
                                    )}
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
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {selectedMentorship.menteeAvatar ? (
                                        <img src={selectedMentorship.menteeAvatar} alt="Mentee" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-blue-700 font-bold">
                                            {selectedMentorship.mentee.charAt(0)}
                                        </span>
                                    )}
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
                            <div className="col-span-2 pt-2">
                                <p className="text-sm text-gray-600 font-semibold mb-1">Activity Details</p>
                                <div className="p-3 bg-gray-50 rounded border border-gray-100 text-sm text-gray-700 italic">
                                    "{selectedMentorship.details || 'No details available'}"
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
                                <button
                                    onClick={() => handleEndConnection(selectedMentorship)}
                                    className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold flex-1 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
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
