import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Check, X, Trash2, ExternalLink } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { JobStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const JobPostsManagement: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'All' | JobStatus>('All');
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    poster:users!fk_jobs_creator(full_name),
                    status_info:job_statuses!fk_jobs_status(name),
                    applications:job_applications(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped = data.map(j => ({
                    ...j,
                    postedBy: j.poster?.full_name || 'System',
                    datePosted: j.created_at,
                    status: j.status_info?.name || 'Pending',
                }));
                setJobs(mapped);
            }
        } catch (error: any) {
            showToast(error.message || 'Error fetching jobs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = selectedTab === 'All'
        ? jobs
        : jobs.filter(job => job.status === selectedTab);

    const handleApprove = async (job: any) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status_id: 2 }) // 2 = Approved
                .eq('id', job.id);
            
            if (error) throw error;
            showToast(`Job post "${job.title}" has been approved`, 'success');
            setIsModalOpen(false);
            fetchJobs();
        } catch (error: any) {
            showToast(error.message || 'Approval failed', 'error');
        }
    };

    const handleReject = async (job: any) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status_id: 3 }) // 3 = Rejected
                .eq('id', job.id);
            
            if (error) throw error;
            showToast(`Job post "${job.title}" has been rejected`, 'warning');
            setIsModalOpen(false);
            fetchJobs();
        } catch (error: any) {
            showToast(error.message || 'Rejection failed', 'error');
        }
    };

    const handleDelete = async (job: any) => {
        if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
            try {
                const { error } = await supabase
                    .from('jobs')
                    .delete()
                    .eq('id', job.id);
                
                if (error) throw error;
                showToast(`Job post "${job.title}" has been deleted`, 'success');
                fetchJobs();
            } catch (error: any) {
                showToast(error.message || 'Delete failed', 'error');
            }
        }
    };

    const columns = [
        {
            key: 'title',
            label: 'Job Title',
            render: (job: any) => (
                <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 px-2 py-1 rounded-full hover:bg-primary-100 transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Visit Job Site
                    </a>
                </div>
            ),
        },
        {
            key: 'postedBy',
            label: 'Posted By',
        },
        {
            key: 'status',
            label: 'Status',
            render: (job: any) => <StatusBadge variant={job.status} />,
        },
        {
            key: 'datePosted',
            label: 'Date Posted',
            render: (job: any) => formatDate(job.datePosted),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (job: any) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedJob(job);
                            setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    {job.status === 'Pending' && (
                        <>
                            <button
                                onClick={() => handleApprove(job)}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                            >
                                <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                                onClick={() => handleReject(job)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                            >
                                <X className="w-4 h-4 text-red-600" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => handleDelete(job)}
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
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Job Posts Management</h1>
                    <p className="text-gray-600 mt-1">Review and manage all job postings</p>
                </div>
                <button 
                    onClick={fetchJobs}
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
                    <p className="text-sm text-gray-600">Total Posts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{jobs.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {jobs.filter(j => j.status === 'Pending').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {jobs.filter(j => j.status === 'Approved').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {jobs.filter(j => j.status === 'Rejected').length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
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
                data={filteredJobs}
                columns={columns}
                searchPlaceholder="Search job posts..."
                emptyMessage="No job posts found"
            />

            {/* Job Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Job Post Details"
                size="lg"
            >
                {selectedJob && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h3>
                            <div className="flex gap-2 mt-3">
                                <StatusBadge variant={selectedJob.status} />
                            </div>
                            {selectedJob.job_url && (
                                <a
                                    href={selectedJob.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Visit Job Site
                                </a>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-gray-600">Posted By</p>
                                <p className="font-medium text-gray-900">{selectedJob.postedBy}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date Posted</p>
                                <p className="font-medium text-gray-900">{formatDate(selectedJob.datePosted)}</p>
                            </div>
                        </div>

                        {selectedJob.status === 'Pending' && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleApprove(selectedJob)}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedJob)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex-1 flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default JobPostsManagement;
