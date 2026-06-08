import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Calendar, MapPin, Users, Edit, Eye, Check, XCircle,
    Trash2, Search, RefreshCw, Clock, X, Save
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ─── Status config ────────────────────────────────────────────────────────────
// These IDs MUST match what's seeded in the event_statuses table:
//   1 = Pending | 2 = Approved | 3 = Rejected
const STATUS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
} as const;

type StatusId = 1 | 2 | 3;

interface EventRow {
    id: string;
    title: string;
    description: string | null;
    venue: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    status_id: StatusId;
    total_seats: number;
    enrolled_count: number;
    image_url: string | null;
    creator_id: string;
    created_at: string;
    creator_name: string;
}

const statusLabel: Record<StatusId, string> = {
    1: 'Pending',
    2: 'Approved',
    3: 'Rejected',
};

const statusStyles: Record<StatusId, string> = {
    1: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    2: 'bg-green-100 text-green-700 border border-green-200',
    3: 'bg-red-100 text-red-700 border border-red-200',
};

// ─── Blank form ───────────────────────────────────────────────────────────────
const blankForm = () => ({
    title: '',
    description: '',
    venue: '',
    event_date: '',
    start_time: '',
    end_time: '',
    total_seats: 50,
    image_url: '',
});

type EventForm = ReturnType<typeof blankForm>;

// ─── Shared form fields component ───────────────────────────────────────────
// Moved outside to prevent re-mounting and focus loss on every keystroke
interface EventFormFieldsProps {
    form: EventForm;
    setForm: (form: EventForm) => void;
}

const EventFormFields: React.FC<EventFormFieldsProps> = ({ form, setForm }) => (
    <>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                placeholder="e.g. Alumni Networking Night"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="input-field"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                <input
                    type="number"
                    min={1}
                    value={form.total_seats}
                    onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })}
                    className="input-field"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="input-field"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="input-field"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="input-field"
                placeholder="e.g. Auditorium A, Block B"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                placeholder="Describe the event..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
            <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
            />
            {/* Live preview */}
            {form.image_url && form.image_url.trim() !== '' && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-32 bg-gray-50 flex items-center justify-center">
                    <img
                        src={form.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent && !parent.querySelector('p')) {
                                const msg = document.createElement('p');
                                msg.className = 'text-xs text-gray-400';
                                msg.textContent = '⚠️ Image failed to load — check the URL';
                                parent.appendChild(msg);
                            }
                        }}
                        onLoad={(e) => {
                            (e.target as HTMLImageElement).style.display = 'block';
                        }}
                    />
                </div>
            )}
        </div>
    </>
);

// ─── Component ────────────────────────────────────────────────────────────────
const EventsManagement: React.FC = () => {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
    const [form, setForm] = useState<EventForm>(blankForm());
    const [isSaving, setIsSaving] = useState(false);

    const { showToast } = useToast();
    const searchRef = useRef<HTMLInputElement>(null);

    // ── Admin user id for creator_id on create ────────────────────────────────
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setAdminUserId(data.user?.id ?? null));
        fetchEvents();
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*, creator:users!creator_id(full_name)')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const rows: EventRow[] = (data || []).map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description ?? '',
                venue: e.venue ?? '',
                event_date: e.event_date,
                start_time: e.start_time ?? '',
                end_time: e.end_time ?? '',
                status_id: (e.status_id ?? 1) as StatusId,
                total_seats: e.total_seats ?? 0,
                enrolled_count: e.enrolled_count ?? 0,
                image_url: e.image_url ?? null,
                creator_id: e.creator_id,
                created_at: e.created_at,
                creator_name: e.creator?.full_name ?? 'Unknown',
            }));

            setEvents(rows);
        } catch (err: any) {
            showToast(`Error loading events: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = events.filter((e) => {
        const matchTab =
            filterTab === 'all' ||
            (filterTab === 'pending' && e.status_id === STATUS.PENDING) ||
            (filterTab === 'approved' && e.status_id === STATUS.APPROVED) ||
            (filterTab === 'rejected' && e.status_id === STATUS.REJECTED);

        const q = searchQuery.toLowerCase();
        const matchSearch =
            !q ||
            e.title.toLowerCase().includes(q) ||
            (e.venue ?? '').toLowerCase().includes(q) ||
            e.creator_name.toLowerCase().includes(q);

        return matchTab && matchSearch;
    });

    // ── Update status (Approve / Reject) ──────────────────────────────────────
    const handleUpdateStatus = async (eventId: string, newStatus: StatusId) => {
        try {
            const { error, data } = await supabase
                .from('events')
                .update({ status_id: newStatus })
                .eq('id', eventId)
                .select();
            
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Action failed: You may not have permission to update this event.', 'error');
                return;
            }

            showToast(
                newStatus === STATUS.APPROVED ? '✅ Event Approved and Published Successfully!' : '❌ Event Rejected.',
                newStatus === STATUS.APPROVED ? 'success' : 'error'
            );
            
            // Fetch fresh data to ensure UI is perfectly synced with DB
            fetchEvents();
        } catch (err: any) {
            showToast(`Failed: ${err.message}`, 'error');
        }
    };

    // ── Soft delete ───────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!selectedEvent) return;
        try {
            const { error } = await supabase
                .from('events')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', selectedEvent.id);
            if (error) throw error;

            showToast('Event deleted.', 'success');
            setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
            setIsDeleteOpen(false);
            setSelectedEvent(null);
        } catch (err: any) {
            showToast(`Delete failed: ${err.message}`, 'error');
        }
    };

    // ── Create ────────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUserId) {
            showToast('Admin user ID not found. Please refresh.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase.from('events').insert({
                title: form.title,
                description: form.description || null,
                venue: form.venue || null,
                event_date: form.event_date,
                start_time: form.start_time || null,
                end_time: form.end_time || null,
                status_id: STATUS.APPROVED, // Admin-created events are auto-approved
                total_seats: Number(form.total_seats),
                enrolled_count: 0,
                image_url: form.image_url || null,
                creator_id: adminUserId,
            });
            if (error) throw error;

            showToast('Event created and published!', 'success');
            setIsCreateOpen(false);
            setForm(blankForm());
            fetchEvents();
        } catch (err: any) {
            showToast(`Create failed: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const openEdit = (ev: EventRow) => {
        setSelectedEvent(ev);
        setForm({
            title: ev.title,
            description: ev.description ?? '',
            venue: ev.venue ?? '',
            event_date: ev.event_date,
            start_time: ev.start_time ?? '',
            end_time: ev.end_time ?? '',
            total_seats: ev.total_seats,
            image_url: ev.image_url ?? '',
        });
        setIsEditOpen(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: form.title,
                    description: form.description || null,
                    venue: form.venue || null,
                    event_date: form.event_date,
                    start_time: form.start_time || null,
                    end_time: form.end_time || null,
                    total_seats: Number(form.total_seats),
                    image_url: form.image_url || null,
                })
                .eq('id', selectedEvent.id);
            if (error) throw error;

            showToast('Event updated successfully!', 'success');
            setIsEditOpen(false);
            fetchEvents();
        } catch (err: any) {
            showToast(`Update failed: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const pending = events.filter((e) => e.status_id === STATUS.PENDING).length;
    const approved = events.filter((e) => e.status_id === STATUS.APPROVED).length;
    const rejected = events.filter((e) => e.status_id === STATUS.REJECTED).length;
    const totalEnrolled = events.reduce((s, e) => s + e.enrolled_count, 0);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabs = [
        { key: 'all', label: 'All Events', count: events.length },
        { key: 'pending', label: 'Pending', count: pending },
        { key: 'approved', label: 'Approved', count: approved },
        { key: 'rejected', label: 'Rejected', count: rejected },
    ] as const;


    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Review and approve events submitted by Alumni & Seniors
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchEvents}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setForm(blankForm()); setIsCreateOpen(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Event
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Approval', value: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Approved Events', value: approved, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Rejected', value: rejected, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Total Enrolled', value: totalEnrolled, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((s) => (
                    <div key={s.label} className={`${s.bg} p-4 rounded-xl border border-gray-100`}>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color} mt-1`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Filter Tabs + Search ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${filterTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 w-56"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Events Grid ── */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-sm mt-1">
                        {searchQuery ? 'Try a different search term.' : 'Events created from the mobile app will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((event) => (
                        <div
                            key={event.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
                        >
                            {/* Image */}
                            <div className="h-44 relative overflow-hidden">
                                {event.image_url ? (
                                    <img
                                        src={event.image_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-400 via-primary-500 to-indigo-600 flex items-center justify-center">
                                        <Calendar className="w-14 h-14 text-white opacity-40" />
                                    </div>
                                )}
                                {/* Status Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[event.status_id]}`}>
                                        {statusLabel[event.status_id]}
                                    </span>
                                </div>
                                {/* Action buttons overlay */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setSelectedEvent(event); setIsDetailOpen(true); }}
                                        className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-primary-600"
                                        title="View details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(event)}
                                        className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-blue-600"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedEvent(event); setIsDeleteOpen(true); }}
                                        className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1">{event.title}</h3>
                                <p className="text-xs text-gray-400 mb-3">by {event.creator_name}</p>

                                <div className="space-y-1.5 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        <span>{formatDate(event.event_date)}</span>
                                        {event.start_time && (
                                            <span className="flex items-center gap-1 ml-auto text-xs">
                                                <Clock className="w-3 h-3" />
                                                {event.start_time}
                                            </span>
                                        )}
                                    </div>
                                    {event.venue && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 shrink-0" />
                                        <span>{event.enrolled_count} / {event.total_seats} enrolled</span>
                                        {event.total_seats > 0 && (
                                            <div className="ml-auto w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (event.enrolled_count / event.total_seats) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Approve / Reject only for Pending */}
                                {event.status_id === STATUS.PENDING && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleUpdateStatus(event.id, STATUS.APPROVED)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(event.id, STATUS.REJECTED)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {/* Re-approve a rejected event */}
                                {event.status_id === STATUS.REJECTED && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleUpdateStatus(event.id, STATUS.APPROVED)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                            Re-approve
                                        </button>
                                    </div>
                                )}

                                {/* Reject an approved event */}
                                {event.status_id === STATUS.APPROVED && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleUpdateStatus(event.id, STATUS.REJECTED)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Revoke Approval
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Create Event Modal
            ══════════════════════════════════════════════════════════════════ */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Event" size="lg">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mb-2">
                        <Check className="w-4 h-4 shrink-0" />
                        Admin-created events are automatically approved and visible to users.
                    </div>
                    <EventFormFields form={form} setForm={setForm} />
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isSaving ? 'Creating...' : 'Create & Publish'}
                        </button>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary flex-1">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══════════════════════════════════════════════════════════════════
                Edit Event Modal
            ══════════════════════════════════════════════════════════════════ */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Event" size="lg">
                <form onSubmit={handleEdit} className="space-y-4">
                    <EventFormFields form={form} setForm={setForm} />
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary flex-1">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══════════════════════════════════════════════════════════════════
                Detail Modal
            ══════════════════════════════════════════════════════════════════ */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Event Details" size="xl">
                {selectedEvent && (
                    <div className="space-y-5">
                        {/* Hero image */}
                        <div className="h-56 rounded-xl overflow-hidden">
                            {selectedEvent.image_url ? (
                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center">
                                    <Calendar className="w-20 h-20 text-white opacity-40" />
                                </div>
                            )}
                        </div>

                        {/* Title + status */}
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${statusStyles[selectedEvent.status_id]}`}>
                                {statusLabel[selectedEvent.status_id]}
                            </span>
                        </div>

                        {/* Creator */}
                        <p className="text-sm text-gray-500">Posted by <span className="font-medium text-gray-700">{selectedEvent.creator_name}</span></p>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(selectedEvent.event_date)}</span>
                            </div>
                            {selectedEvent.start_time && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{selectedEvent.start_time} – {selectedEvent.end_time}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600 col-span-2">
                                <MapPin className="w-4 h-4" />
                                <span>{selectedEvent.venue || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{selectedEvent.enrolled_count} / {selectedEvent.total_seats} enrolled</span>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedEvent.description && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            {selectedEvent.status_id === STATUS.PENDING && (
                                <>
                                    <button
                                        onClick={() => { handleUpdateStatus(selectedEvent.id, STATUS.APPROVED); setIsDetailOpen(false); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                                    >
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => { handleUpdateStatus(selectedEvent.id, STATUS.REJECTED); setIsDetailOpen(false); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </>
                            )}
                            {selectedEvent.status_id === STATUS.APPROVED && (
                                <button
                                    onClick={() => { handleUpdateStatus(selectedEvent.id, STATUS.REJECTED); setIsDetailOpen(false); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors"
                                >
                                    <XCircle className="w-4 h-4" /> Revoke Approval
                                </button>
                            )}
                            {selectedEvent.status_id === STATUS.REJECTED && (
                                <button
                                    onClick={() => { handleUpdateStatus(selectedEvent.id, STATUS.APPROVED); setIsDetailOpen(false); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                                >
                                    <Check className="w-4 h-4" /> Re-approve
                                </button>
                            )}
                            <button
                                onClick={() => openEdit(selectedEvent)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ══════════════════════════════════════════════════════════════════
                Delete Confirmation Modal
            ══════════════════════════════════════════════════════════════════ */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Event" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                        Are you sure you want to delete <span className="font-semibold text-gray-900">"{selectedEvent?.title}"</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventsManagement;
