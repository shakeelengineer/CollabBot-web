import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Flag, CheckCircle, XCircle, AlertTriangle, User, MessageSquare, HelpCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const ReportsManagement: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, urgent: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Fetch Reports with joined user data
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:users!reporter_id(full_name),
                    target:users!target_user_id(full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setReports(data || []);

            // Calculate Stats
            const pending = data?.filter(r => r.status === 'pending').length || 0;
            const resolved = data?.filter(r => r.status === 'resolved').length || 0;
            const urgent = data?.filter(r => r.reason.includes('Harassment') || r.reason.includes('Scam')).length || 0;

            setStats({
                total: data?.length || 0,
                pending,
                resolved,
                urgent
            });
        } catch (error: any) {
            showToast('Failed to fetch reports', 'error');
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', reportId);

            if (error) throw error;

            showToast(`Report marked as ${newStatus}`, 'success');
            setIsModalOpen(false);
            fetchReports();
        } catch (error: any) {
            showToast('Failed to update report status', 'error');
        }
    };

    const columns = [
        {
            key: 'content_type',
            label: 'Type',
            render: (item: any) => {
                const Icon = item.content_type === 'user' ? User : 
                             item.content_type === 'answer' ? CheckCircle : HelpCircle;
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary-500" />
                        <span className="capitalize text-gray-900">{item.content_type}</span>
                    </div>
                );
            }
        },
        {
            key: 'reason',
            label: 'Reason',
            render: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{item.reason}</span>
                    <span className="text-xs text-gray-500 truncate max-w-xs">{item.description}</span>
                </div>
            )
        },
        {
            key: 'reporter',
            label: 'Reported By',
            render: (item: any) => <span className="text-gray-700">{item.reporter?.full_name || 'System'}</span>
        },
        {
            key: 'date',
            label: 'Date',
            render: (item: any) => formatDate(item.created_at)
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
                <StatusBadge 
                    variant={item.status === 'pending' ? 'Pending' : item.status === 'resolved' ? 'Resolved' : 'Inactive'} 
                    className={item.status === 'dismissed' ? 'bg-gray-100 text-gray-600' : ''}
                />
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (item: any) => (
                <button
                    onClick={() => {
                        setSelectedReport(item);
                        setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
                >
                    <Eye className="w-4 h-4 text-gray-600 group-hover:text-primary-600" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
                    <p className="text-gray-600 mt-1">Review and take action on user-reported violations</p>
                </div>
                <button 
                    onClick={fetchReports}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Reports" value={stats.total} icon={Flag} color="blue" />
                <StatCard title="Pending Review" value={stats.pending} icon={AlertTriangle} color="yellow" />
                <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
                <StatCard title="Urgent Issues" value={stats.urgent} icon={AlertTriangle} color="red" />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Active Reports</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Live Monitoring
                        </span>
                    </div>
                </div>
                <DataTable
                    data={reports}
                    columns={columns}
                    searchPlaceholder="Search reports by reason or user..."
                    emptyMessage="No reports found"
                />
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Report Details"
                size="md"
            >
                {selectedReport && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                <Flag className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reason</p>
                                <h3 className="text-lg font-bold text-gray-900">{selectedReport.reason}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase">Reporter</p>
                                <p className="font-bold text-gray-900">{selectedReport.reporter?.full_name}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase">Target User</p>
                                <p className="font-bold text-gray-900">{selectedReport.target?.full_name || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-900 mb-2">Description</p>
                            <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm italic">
                                "{selectedReport.description || 'No additional details provided.'}"
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Resolve
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReportsManagement;
