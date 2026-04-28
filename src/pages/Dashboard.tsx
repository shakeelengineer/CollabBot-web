import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '@/components/StatCard';
import { formatDateTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface ActivityItem {
    id: string;
    user: string;
    action: string;
    timestamp: string;
    type: 'user' | 'event' | 'question' | 'match';
}

interface PendingItem {
    id: string;
    title: string;
    type: string;
    timestamp: string;
}

const Dashboard: React.FC = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeMatches: 0,
        pendingEvents: 0,
        newUsersThisWeek: 0
    });
    const [distribution, setDistribution] = useState([
        { name: 'Juniors', value: 0, fill: '#3b82f6' },
        { name: 'Seniors', value: 0, fill: '#6366f1' },
        { name: 'Alumni', value: 0, fill: '#8b5cf6' },
    ]);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingItem[]>([]);
    const [engagementData, setEngagementData] = useState<{ day: string, engagement: number }[]>([]);

    useEffect(() => {
        fetchAllData();

        // Subscribe to real-time changes on users table
        const userSubscription = supabase
            .channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                fetchAllData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(userSubscription);
        };
    }, []);

    const fetchAllData = async () => {
        try {
            await Promise.all([
                fetchStatsAndDistribution(),
                fetchRecentActivity(),
                fetchPendingApprovals(),
                fetchEngagementData()
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            // Data fetched
        }
    };

    const fetchStatsAndDistribution = async () => {
        // Total Users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);

        // Active Matches (as proxy for mentorship/engagement)
        const { count: activeMatches } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true });

        // Pending Events
        const { count: pendingEvents } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('status_id', 1) // Assuming 1 is pending
            .is('deleted_at', null);

        // Roles distribution
        const { data: users } = await supabase
            .from('users')
            .select('role')
            .is('deleted_at', null);

        const roles = users?.reduce((acc: any, curr) => {
            const role = (curr.role || 'User').trim();
            const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
            acc[formattedRole] = (acc[formattedRole] || 0) + 1;
            return acc;
        }, {}) || {};

        setStats({
            totalUsers: totalUsers ?? 0,
            activeMatches: activeMatches ?? 0,
            pendingEvents: pendingEvents ?? 0,
            newUsersThisWeek: 0 // Will be updated by engagement fetch
        });

        const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        const dynamicDistribution = Object.keys(roles).map((role, index) => ({
            name: role,
            value: roles[role],
            fill: colors[index % colors.length]
        }));

        setDistribution(dynamicDistribution.length > 0 ? dynamicDistribution : [
            { name: 'No Data', value: 1, fill: '#f3f4f6' }
        ]);
    };

    const fetchRecentActivity = async () => {
        // Fetch latest 5 users
        const { data: latestUsers } = await supabase
            .from('users')
            .select('id, full_name, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        // Fetch latest 5 events
        const { data: latestEvents } = await supabase
            .from('events')
            .select(`
                id, 
                title, 
                created_at, 
                creator_id, 
                creator:users!creator_id(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        const activities: ActivityItem[] = [];

        latestUsers?.forEach(u => {
            activities.push({
                id: `user-${u.id}`,
                user: u.full_name,
                action: 'joined the platform',
                timestamp: u.created_at,
                type: 'user'
            });
        });

        latestEvents?.forEach(e => {
            activities.push({
                id: `event-${e.id}`,
                user: (e.creator as any)?.full_name || 'A user',
                action: `created an event: ${e.title}`,
                timestamp: e.created_at || '',
                type: 'event'
            });
        });

        setRecentActivity(activities.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 8));
    };

    const fetchPendingApprovals = async () => {
        const [ { data: pendingEvents }, { data: pendingJobs } ] = await Promise.all([
            supabase.from('events').select('id, title, created_at').eq('status_id', 1).is('deleted_at', null).order('created_at', { ascending: false }),
            supabase.from('jobs').select('id, title, created_at').eq('status', 'Pending').order('created_at', { ascending: false })
        ]);

        const items: PendingItem[] = [];

        pendingEvents?.forEach(e => {
            items.push({
                id: e.id,
                title: e.title,
                type: 'Event',
                timestamp: e.created_at || ''
            });
        });

        pendingJobs?.forEach(j => {
            items.push({
                id: j.id,
                title: j.title,
                type: 'Job',
                timestamp: j.created_at || ''
            });
        });

        setPendingApprovals(items);
    };

    const fetchEngagementData = async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: users } = await supabase
            .from('users')
            .select('created_at')
            .gte('created_at', sevenDaysAgo.toISOString());

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                day: dayNames[d.getDay()],
                dateStr: d.toISOString().split('T')[0],
                engagement: 0
            };
        });

        users?.forEach(u => {
            const dateStr = u.created_at.split('T')[0];
            const dayEntry = last7Days.find(d => d.dateStr === dateStr);
            if (dayEntry) dayEntry.engagement++;
        });

        setEngagementData(last7Days.map(({ day, engagement }) => ({ day, engagement })));
        setStats(prev => ({ ...prev, newUsersThisWeek: users?.length || 0 }));
    };

    const handleApproveItem = async (id: string, type: string) => {
        try {
            const table = type === 'Event' ? 'events' : 'jobs';
            const payload = type === 'Event' ? { status_id: 2 } : { status: 'Approved' };
            
            const { error, data } = await supabase
                .from(table)
                .update(payload)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            showToast(`${type} approved successfully`, 'success');
            fetchPendingApprovals();
            fetchStatsAndDistribution();
        } catch (error: any) {
            showToast(error.message || `Error approving ${type}`, 'error');
        }
    };

    const handleRejectItem = async (id: string, type: string) => {
        try {
            const table = type === 'Event' ? 'events' : 'jobs';
            const payload = type === 'Event' ? { status_id: 3 } : { status: 'Rejected' };
            
            const { error } = await supabase
                .from(table)
                .update(payload)
                .eq('id', id);
            
            if (error) throw error;
            showToast(`${type} rejected`, 'warning');
            fetchPendingApprovals();
            fetchStatsAndDistribution();
        } catch (error: any) {
            showToast(error.message || `Error rejecting ${type}`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    Job Post feature will Complete Soon INSHALLAH
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    trend={{ value: 'Real-time', isPositive: true }}
                />
                <StatCard
                    title="Active Matches"
                    value={stats.activeMatches}
                    icon={UserCheck}
                    trend={{ value: 'Collaborations', isPositive: true }}
                />
                <StatCard
                    title="Pending Events"
                    value={stats.pendingEvents}
                    icon={Clock}
                    trend={{ value: 'Review needed', isPositive: stats.pendingEvents === 0 }}
                />
                <StatCard
                    title="Weekly Signups"
                    value={stats.newUsersThisWeek}
                    icon={TrendingUp}
                    trend={{ value: 'Last 7 days', isPositive: true }}
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
                                data={distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                        {distribution.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly Engagement Area Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Signup Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={engagementData}>
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
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        activity.type === 'user' ? 'bg-blue-50 text-blue-500' : 
                                        activity.type === 'event' ? 'bg-purple-50 text-purple-500' : 'bg-gray-50 text-gray-500'
                                    }`}>
                                        {activity.type === 'user' ? <Users size={18} /> : <Calendar size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{activity.user}</span> {activity.action}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No recent activity</p>
                        )}
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {pendingApprovals.length > 0 ? (
                            pendingApprovals.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">{item.type}</span>
                                            <span className="text-[10px] text-gray-400">•</span>
                                            <span className="text-xs text-gray-400">{formatDateTime(item.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleApproveItem(item.id, item.type)}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleRejectItem(item.id, item.type)}
                                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                <p>No pending approvals</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

