export type UserType = 'Junior' | 'Senior' | 'Alumni';
export type UserStatus = 'Active' | 'Inactive';
export type JobStatus = 'Pending' | 'Approved' | 'Rejected';
export type ReportStatus = 'Pending' | 'Resolved' | 'Escalated';
export type EventStatus = 'Pending' | 'Approved' | 'Rejected' | 'Upcoming' | 'Ongoing' | 'Completed';
export type MentorshipStatus = 'Active' | 'Completed' | 'Pending';

export interface User {
    id: string;
    name: string;
    email: string;
    userType: UserType;
    department: string;
    status: UserStatus;
    joinDate: string;
    avatar?: string;
}

export interface JobPost {
    id: string;
    title: string;
    postedBy: string;
    company: string;
    status: JobStatus;
    datePosted: string;
    description: string;
}

export interface Report {
    id: string;
    reporter_id: string;
    target_user_id?: string;
    target_content_id?: string;
    content_type: string;
    reason: string;
    description?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reporter?: { full_name: string };
    target?: { full_name: string };
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    attendeeCount: number;
    status: EventStatus;
    status_id?: number;
    image?: string;
    image_url?: string;
    description: string;
    total_seats?: number;
    enrolled_count?: number;
}

export interface MentorshipConnection {
    id: string;
    mentor: string;
    mentee: string;
    connectionDate: string;
    status: MentorshipStatus;
    lastInteraction: string;
}

export interface DashboardStats {
    totalUsers: number;
    activeMentorships: number;
    pendingApprovals: number;
    weeklyEngagement: number;
}

export interface ActivityItem {
    id: string;
    user: string;
    action: string;
    timestamp: string;
    type: 'user' | 'job' | 'event' | 'mentorship';
}
