import React, { useState, useEffect } from 'react';
import { User, Save, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile'>('profile');
    const { showToast } = useToast();
    const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '', bio: '', avatar_url: '' });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
