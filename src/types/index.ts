export type UserType = 'Junior' | 'Senior' | 'Alumni';
export type UserStatus = 'Active' | 'Inactive';
export type JobStatus = 'Pending' | 'Approved' | 'Rejected';
export type ReportStatus = 'Pending' | 'Resolved' | 'Escalated';
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed';
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
    reportedBy: string;
    reportedAgainst: string;
    type: string;
    status: ReportStatus;
    date: string;
    description: string;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    attendeeCount: number;
    status: EventStatus;
    image: string;
    description: string;
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
