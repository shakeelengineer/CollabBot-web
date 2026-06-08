import React, { useState } from 'react';
import { Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { Flag, Clock, CheckCheck, AlertOctagon } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { mockReports } from '@/data/mockData';
import { Report, ReportStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const ReportsManagement: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'All' | ReportStatus>('All');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const filteredReports = selectedTab === 'All'
        ? mockReports
        : mockReports.filter(report => report.status === selectedTab);

    const handleResolve = (report: Report) => {
        showToast(`Report #${report.id} has been marked as resolved`, 'success');
        setIsModalOpen(false);
    };

    const handleEscalate = (report: Report) => {
        showToast(`Report #${report.id} has been escalated`, 'warning');
        setIsModalOpen(false);
    };

    const columns = [
        {
            key: 'id',
            label: 'Report ID',
            render: (report: Report) => (
                <span className="font-mono text-sm font-medium text-gray-900">#{report.id}</span>
            ),
        },
        {
            key: 'reportedBy',
            label: 'Reported By',
        },
        {
            key: 'reportedAgainst',
            label: 'Against',
        },
        {
            key: 'type',
            label: 'Type',
            render: (report: Report) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {report.type}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (report: Report) => <StatusBadge variant={report.status} />,
        },
        {
            key: 'date',
            label: 'Date',
            render: (report: Report) => formatDate(report.date),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (report: Report) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedReport(report);
                            setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    {report.status === 'Pending' && (
                        <>
                            <button
                                onClick={() => handleResolve(report)}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark Resolved"
                            >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                                onClick={() => handleEscalate(report)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Escalate"
                            >
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Complaints</h1>
                <p className="text-gray-600 mt-1">Review and manage user reports and complaints</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Reports"
                    value={mockReports.length}
                    icon={Flag}
                />
                <StatCard
                    title="Pending"
                    value={mockReports.filter(r => r.status === 'Pending').length}
                    icon={Clock}
                />
                <StatCard
                    title="Resolved"
                    value={mockReports.filter(r => r.status === 'Resolved').length}
                    icon={CheckCheck}
                />
                <StatCard
                    title="Escalated"
                    value={mockReports.filter(r => r.status === 'Escalated').length}
                    icon={AlertOctagon}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {['All', 'Pending', 'Resolved', 'Escalated'].map((tab) => (
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
                data={filteredReports}
                columns={columns}
                searchPlaceholder="Search reports..."
                emptyMessage="No reports found"
            />

            {/* Report Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Report Details"
                size="lg"
            >
                {selectedReport && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-mono text-lg font-semibold text-gray-900">#{selectedReport.id}</p>
                                <p className="text-sm text-gray-600 mt-1">{formatDate(selectedReport.date)}</p>
                            </div>
                            <div className="flex gap-2">
                                <StatusBadge variant={selectedReport.status} />
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    {selectedReport.type}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-gray-600">Reported By</p>
                                <p className="font-medium text-gray-900">{selectedReport.reportedBy}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Reported Against</p>
                                <p className="font-medium text-gray-900">{selectedReport.reportedAgainst}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">Description</p>
                            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedReport.description}</p>
                        </div>

                        {selectedReport.status === 'Pending' && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleResolve(selectedReport)}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark as Resolved
                                </button>
                                <button
                                    onClick={() => handleEscalate(selectedReport)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex-1 flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Escalate
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReportsManagement;
