import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Users, Edit, X as XIcon, Eye } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { mockEvents } from '@/data/mockData';
import { Event } from '@/types';
import { formatDate } from '@/lib/utils';

const EventsManagement: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { showToast } = useToast();

    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Event created successfully', 'success');
        setIsCreateModalOpen(false);
    };

    const handleCancelEvent = (event: Event) => {
        if (confirm(`Are you sure you want to cancel "${event.title}"?`)) {
            showToast(`Event "${event.title}" has been cancelled`, 'warning');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage platform events</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {mockEvents.filter(e => e.status === 'Upcoming').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Ongoing Events</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                        {mockEvents.filter(e => e.status === 'Ongoing').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600">Completed Events</p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">
                        {mockEvents.filter(e => e.status === 'Completed').length}
                    </p>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Event Image */}
                        <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white opacity-50" />
                        </div>

                        {/* Event Content */}
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 flex-1">{event.title}</h3>
                                <StatusBadge variant={event.status} />
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{event.attendeeCount} attendees</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
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
                                {event.status === 'Upcoming' && (
                                    <button
                                        onClick={() => handleCancelEvent(event)}
                                        className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                        <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center rounded-lg">
                            <Calendar className="w-20 h-20 text-white opacity-50" />
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
                                <p className="text-sm text-gray-600">Attendees</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <Users className="w-4 h-4" />
                                    {selectedEvent.attendeeCount}
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
                            <p className="text-gray-900">{selectedEvent.description}</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button className="btn-primary flex-1">View Attendees</button>
                            <button className="btn-secondary flex-1">Edit Event</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EventsManagement;
