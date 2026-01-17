import React, { useState } from 'react';
import { Eye, Check, X, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { mockJobPosts } from '@/data/mockData';
import { JobPost, JobStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const JobPostsManagement: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'All' | JobStatus>('All');
    const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const filteredJobs = selectedTab === 'All'
        ? mockJobPosts
        : mockJobPosts.filter(job => job.status === selectedTab);

    const handleApprove = (job: JobPost) => {
        showToast(`Job post "${job.title}" has been approved`, 'success');
        setIsModalOpen(false);
    };

    const handleReject = (job: JobPost) => {
        showToast(`Job post "${job.title}" has been rejected`, 'warning');
        setIsModalOpen(false);
    };

    const handleDelete = (job: JobPost) => {
        if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
            showToast(`Job post "${job.title}" has been deleted`, 'success');
        }
    };

    const columns = [
        {
            key: 'title',
            label: 'Job Title',
            render: (job: JobPost) => (
                <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company}</p>
                </div>
            ),
        },
        {
            key: 'postedBy',
            label: 'Posted By',
        },
        {
            key: 'company',
            label: 'Company',
        },
        {
            key: 'status',
            label: 'Status',
            render: (job: JobPost) => <StatusBadge variant={job.status} />,
        },
        {
            key: 'datePosted',
            label: 'Date Posted',
            render: (job: JobPost) => formatDate(job.datePosted),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (job: JobPost) => (
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Posts Management</h1>
                <p className="text-gray-600 mt-1">Review and manage all job postings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Total Posts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{mockJobPosts.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {mockJobPosts.filter(j => j.status === 'Pending').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {mockJobPosts.filter(j => j.status === 'Approved').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {mockJobPosts.filter(j => j.status === 'Rejected').length}
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
                            <p className="text-lg text-gray-600 mt-1">{selectedJob.company}</p>
                            <div className="flex gap-2 mt-3">
                                <StatusBadge variant={selectedJob.status} />
                            </div>
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

                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">Description</p>
                            <p className="text-gray-900">{selectedJob.description}</p>
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
