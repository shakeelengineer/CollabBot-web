import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AdminHeaderProps {
    onMenuClick: () => void;
}

interface UserProfile {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
}

interface NotificationItem {
    id: string;
    title: string;
    time: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
        fetchNotifications();

        // Real-time subscription for new users (notifications)
        const userSubscription = supabase
            .channel('header_users')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(userSubscription);
        };
    }, []);

    const fetchProfile = async () => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data, error } = await supabase
            .from('users')
            .select('full_name, email, role, avatar_url')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            setProfile({
                full_name: user.email?.split('@')[0] ?? 'Admin',
                email: user.email ?? '',
                role: 'Admin',
            });
            return;
        }

        setProfile(data);
    };

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data && data.length > 0) {
            const mapped = data.map(u => ({
                id: u.id,
                title: `New user: ${u.full_name}`,
                time: new Date(u.created_at).toLocaleString()
            }));
            setNotifications(mapped);

            const lastSeenId = localStorage.getItem('lastSeenNotificationId');
            if (data[0].id !== lastSeenId) {
                setHasUnread(true);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName = profile?.full_name ?? '...';
    const displayEmail = profile?.email ?? '...';
    const initials = profile ? getInitials(profile.full_name) : '..';

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>

                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 lg:w-96"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowUserMenu(false);
                                if (!showNotifications && notifications.length > 0) {
                                    setHasUnread(false);
                                    localStorage.setItem('lastSeenNotificationId', notifications[0].id);
                                }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                        >
                            <Bell className="w-6 h-6 text-gray-600" />
                            {hasUnread && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    <span className="text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">
                                        {notifications.length} NEW
                                    </span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="px-4 py-6 text-center text-gray-500 text-sm">No new notifications</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowUserMenu(!showUserMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-medium text-sm">{initials}</span>
                                )}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{displayEmail}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full capitalize">
                                        {profile?.role ?? 'Admin'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Profile Settings
                                </button>
                                <hr className="my-2 border-gray-100" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
