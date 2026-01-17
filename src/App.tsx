import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import JobPostsManagement from './pages/JobPostsManagement';
import ReportsManagement from './pages/ReportsManagement';
import EventsManagement from './pages/EventsManagement';
import MentorshipManagement from './pages/MentorshipManagement';
import Settings from './pages/Settings';
import './index.css';

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Admin Routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="jobs" element={<JobPostsManagement />} />
                        <Route path="reports" element={<ReportsManagement />} />
                        <Route path="events" element={<EventsManagement />} />
                        <Route path="mentorships" element={<MentorshipManagement />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Catch all - redirect to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
