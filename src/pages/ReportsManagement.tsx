import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Eye, Flag, Clock, CheckCheck, AlertOctagon, UserPlus, Briefcase, Calendar } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const ReportsManagement: React.FC = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [stats, setStats] = useState({ users: 0, jobs: 0, events: 0, answers: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchPlatformStatus();
    }, []);

    const fetchPlatformStatus = async () => {
        setLoading(true);
        try {
            // Fetch Counts for Stats
            const [uCount, jCount, eCount, aCount] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('jobs').select('*', { count: 'exact', head: true }),
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('answers').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                users: uCount.count || 0,
                jobs: jCount.count || 0,
                events: eCount.count || 0,
                answers: aCount.count || 0
            });

            // Fetch Recent Activities (Last 5 from each)
            const [recentUsers, recentJobs, recentEvents] = await Promise.all([
                supabase.from('users').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
                supabase.from('jobs').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
                supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(5)
            ]);

            const combined: any[] = [
                ...(recentUsers.data || []).map(u => ({ id: u.id, type: 'User', title: `New User: ${u.full_name}`, date: u.created_at, status: 'Resolved' })),
                ...(recentJobs.data || []).map(j => ({ id: j.id, type: 'Job', title: `New Job: ${j.title}`, date: j.created_at, status: 'Pending' })),
                ...(recentEvents.data || []).map(e => ({ id: e.id, type: 'Event', title: `New Event: ${e.title}`, date: e.created_at, status: 'Active' }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setActivities(combined);
        } catch (error: any) {
            showToast('Failed to fetch platform status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'type',
            label: 'Type',
            render: (item: any) => {
                const Icon = item.type === 'User' ? UserPlus : item.type === 'Job' ? Briefcase : Calendar;
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-gray-900">{item.type}</span>
                    </div>
                );
            }
        },
        {
            key: 'title',
            label: 'Activity Details',
            render: (item: any) => <span className="text-gray-700">{item.title}</span>
        },
        {
            key: 'date',
            label: 'Timestamp',
            render: (item: any) => formatDate(item.date)
        },
        {
            key: 'status',
            label: 'System Status',
            render: (item: any) => <StatusBadge variant={item.status === 'Resolved' ? 'Completed' : item.status} />
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (item: any) => (
                <button
                    onClick={() => {
                        setSelectedActivity(item);
                        setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Eye className="w-4 h-4 text-gray-600" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Platform Activity Audit</h1>
                    <p className="text-gray-600 mt-1">Real-time overview of system interactions and growth</p>
                </div>
                <button 
                    onClick={fetchPlatformStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.users} icon={UserPlus} />
                <StatCard title="Active Jobs" value={stats.jobs} icon={Briefcase} />
                <StatCard title="Live Events" value={stats.events} icon={Calendar} />
                <StatCard title="Total Answers" value={stats.answers} icon={CheckCheck} />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Recent System Events</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Live
                        </span>
                    </div>
                </div>
                <DataTable
                    data={activities}
                    columns={columns}
                    searchPlaceholder="Search system events..."
                    emptyMessage="No recent activity found"
                />
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Activity Details"
                size="md"
            >
                {selectedActivity && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                {selectedActivity.type === 'User' ? <UserPlus className="text-primary-600" /> : 
                                 selectedActivity.type === 'Job' ? <Briefcase className="text-primary-600" /> : 
                                 <Calendar className="text-primary-600" />}
                            </div>
                            <div>
                                <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{selectedActivity.type} Event</p>
                                <h3 className="text-lg font-bold text-gray-900">{selectedActivity.title}</h3>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">Event ID</p>
                            <p className="font-mono text-sm text-gray-900">{selectedActivity.id}</p>
                            <p className="text-sm text-gray-600 mt-4">Occurred At</p>
                            <p className="text-gray-900">{formatDate(selectedActivity.date)}</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-full btn-primary py-3">
                            Close Report
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReportsManagement;
