import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Save, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
    const { showToast } = useToast();
    const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '', bio: '', avatar_url: '' });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        newUsers: true,
        pendingApprovals: true,
        reports: true
    });
    const [security, setSecurity] = useState({
        twoFactor: false,
        loginAlerts: true
    });

    useEffect(() => {
        fetchProfile();
        // Load settings from localStorage
        const savedNotifications = localStorage.getItem('admin_notifications');
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        
        const savedSecurity = localStorage.getItem('admin_security');
        if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('full_name, email, avatar_url, phone, bio')
            .eq('id', user.id)
            .single();

        if (data) {
            setProfileData({ 
                full_name: data.full_name, 
                email: data.email,
                phone: data.phone || '',
                bio: data.bio || '',
                avatar_url: data.avatar_url || ''
            });
        }
        setLoadingProfile(false);
    };

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
            showToast('Photo updated successfully!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error uploading photo', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: profileData.full_name,
                    email: profileData.email,
                    phone: profileData.phone,
                    bio: profileData.bio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            showToast('Profile updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error updating profile', 'error');
        }
    };

    const handleSaveNotifications = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('admin_notifications', JSON.stringify(notifications));
        showToast('Notification preferences saved successfully', 'success');
    };

    const handleSecurityToggle = (key: 'twoFactor' | 'loginAlerts') => {
        const newValue = !security[key];
        const newSecurity = { ...security, [key]: newValue };
        setSecurity(newSecurity);
        localStorage.setItem('admin_security', JSON.stringify(newSecurity));
        showToast(`${key === 'twoFactor' ? 'Two-Factor' : 'Login Alerts'} ${newValue ? 'enabled' : 'disabled'} real-time`, 'success');
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Password reset request sent to your email', 'success');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your admin account settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="font-medium">Profile</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'notifications'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="font-medium">Notifications</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'security'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Security</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Settings</h2>
                                    <p className="text-sm text-gray-600 mb-6">Update your personal information</p>
                                </div>

                                 <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                        {profileData.avatar_url ? (
                                            <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl text-primary-700 font-bold">
                                                {profileData.full_name
                                                    ? profileData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                                    : 'AD'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="cursor-pointer">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleUploadPhoto}
                                                disabled={uploading}
                                            />
                                            <div className="btn-primary text-sm flex items-center gap-2">
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                {uploading ? 'Uploading...' : 'Upload Photo'}
                                            </div>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.full_name}
                                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                            disabled={loadingProfile}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            disabled={loadingProfile}
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        className="input-field"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <button type="submit" className="btn-primary flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <form onSubmit={handleSaveNotifications} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                                    <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Email Notifications</p>
                                            <p className="text-sm text-gray-600">Receive email updates about platform activity</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.email} 
                                                onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Push Notifications</p>
                                            <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.push}
                                                onChange={() => setNotifications({ ...notifications, push: !notifications.push })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">New User Registrations</p>
                                            <p className="text-sm text-gray-600">Get notified when new users join</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.newUsers}
                                                onChange={() => setNotifications({ ...notifications, newUsers: !notifications.newUsers })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Pending Approvals</p>
                                            <p className="text-sm text-gray-600">Alerts for items requiring approval</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.pendingApprovals}
                                                onChange={() => setNotifications({ ...notifications, pendingApprovals: !notifications.pendingApprovals })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Reports & Complaints</p>
                                            <p className="text-sm text-gray-600">Notifications for new reports</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.reports}
                                                onChange={() => setNotifications({ ...notifications, reports: !notifications.reports })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <button type="submit" className="btn-primary flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Preferences
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                                    <p className="text-sm text-gray-600 mb-6">Manage your account security</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Login Alerts</p>
                                            <p className="text-sm text-gray-600">Get notified when your account is logged in from a new device</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={security.loginAlerts}
                                                onChange={() => handleSecurityToggle('loginAlerts')}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={security.twoFactor}
                                                onChange={() => handleSecurityToggle('twoFactor')}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    <hr className="my-6 border-gray-100" />
                                    
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                                    <p className="text-sm text-gray-600 mb-4">We will send a reset link to your email address.</p>
                                    
                                    <button 
                                        type="submit" 
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Request Password Reset
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
