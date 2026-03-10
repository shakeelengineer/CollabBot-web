import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '@/components/StatCard';
import { mockDashboardStats, mockRecentActivity, userDistribution, weeklyEngagementData } from '@/data/mockData';
import { formatDateTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeMentorships: 0,
        pendingApprovals: 0,
        weeklyEngagement: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch real pending events count
            const { count: pendingEvents } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('status_id', 1)
                .is('deleted_at', null);

            // Fetch real total users count
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .is('deleted_at', null);

            setStats({
                totalUsers: totalUsers ?? 0,
                activeMentorships: 12,
                pendingApprovals: pendingEvents ?? 0,
                weeklyEngagement: 85
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers || mockDashboardStats.totalUsers}
                    icon={Users}
                    trend={{ value: '12%', isPositive: true }}
                />
                <StatCard
                    title="Active Mentorships"
                    value={stats.activeMentorships || mockDashboardStats.activeMentorships}
                    icon={UserCheck}
                    trend={{ value: '8%', isPositive: true }}
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals || 0}
                    icon={Clock}
                    trend={{ value: 'Real-time', isPositive: true }}
                />
                <StatCard
                    title="Weekly Engagement"
                    value={stats.weeklyEngagement || mockDashboardStats.weeklyEngagement}
                    icon={TrendingUp}
                    trend={{ value: '18%', isPositive: true }}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {userDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                        {userDistribution.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly Engagement Area Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Engagement</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={weeklyEngagementData}>
                            <defs>
                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="engagement"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorEngagement)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity & Pending Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Feed */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {mockRecentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-500 font-medium text-sm">
                                        {activity.user.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user}</span> {activity.action}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { id: 1, title: 'Software Engineering Intern - Tech Corp', type: 'Job Post' },
                            { id: 2, title: 'UX Designer - Design Studio', type: 'Job Post' },
                            { id: 3, title: 'Report: Spam complaint', type: 'Report' },
                            { id: 4, title: 'New user verification', type: 'User' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{item.type}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                        Approve
                                    </button>
                                    <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
