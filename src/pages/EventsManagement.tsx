import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Edit, Eye, Check, XCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { Event } from '@/types';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const EventsManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*, users(full_name)')
                .order('event_date', { ascending: true });

            if (error) throw error;

            const mappedEvents: Event[] = (data || []).map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.event_date,
                location: e.venue,
                attendeeCount: e.enrolled_count || 0,
                status: getStatusFromId(e.status_id),
                status_id: e.status_id,
                image_url: e.image_url,
                description: e.description,
                total_seats: e.total_seats,
                enrolled_count: e.enrolled_count,
            }));

            setEvents(mappedEvents);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusFromId = (id: number): any => {
        switch (id) {
            case 1: return 'Pending';
            case 2: return 'Approved';
            case 3: return 'Rejected';
            default: return 'Upcoming';
        }
    };

    const handleUpdateStatus = async (eventId: string, newStatusId: number) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ status_id: newStatusId })
                .eq('id', eventId);

            if (error) throw error;

            showToast(`Event state updated successfully`, 'success');
            fetchEvents();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Event creation usually happens in-app, but admin can also create.', 'success');
        setIsCreateModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                    <p className="text-gray-600 mt-1">Review and approve events submitted by Alumni/Seniors</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                        {events.filter(e => e.status_id === 1).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Approved Events</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {events.filter(e => e.status_id === 2).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Rejected/Cancelled</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {events.filter(e => e.status_id === 3).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Total Enrollment</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {events.reduce((sum, e) => sum + (e.enrolled_count || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Events Grid */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Event Image */}
                            <div className="h-48 bg-gray-100 relative">
                                {event.image_url ? (
                                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                        <Calendar className="w-16 h-16 text-white opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <StatusBadge variant={event.status} />
                                </div>
                            </div>

                            {/* Event Content */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{event.title}</h3>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(event.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{event.attendeeCount} / {event.total_seats} enrolled</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 mt-6">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setIsDetailModalOpen(true);
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button className="flex-1 px-3 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                    </div>

                                    {event.status_id === 1 && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(event.id, 2)}
                                                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(event.id, 3)}
                                                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Event Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Event"
                size="lg"
            >
                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                        <input type="text" required className="input-field" placeholder="Enter event title" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input type="date" required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                            <input type="time" required className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input type="text" required className="input-field" placeholder="Enter location" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea rows={4} required className="input-field" placeholder="Event description"></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="btn-primary flex-1">Create Event</button>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Event Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Event Details"
                size="lg"
            >
                {selectedEvent && (
                    <div className="space-y-4">
                        <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                            {selectedEvent.image_url ? (
                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                    <Calendar className="w-20 h-20 text-white opacity-50" />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-start justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                                <StatusBadge variant={selectedEvent.status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(selectedEvent.date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Enrollment</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <Users className="w-4 h-4" />
                                    {selectedEvent.attendeeCount} / {selectedEvent.total_seats}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {selectedEvent.location}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">Description</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</p>
                        </div>

                        {selectedEvent.status_id === 1 && (
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedEvent.id, 2);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Approve Event
                                </button>
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedEvent.id, 3);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    Reject Event
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EventsManagement;
