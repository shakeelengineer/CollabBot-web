import React from 'react';
import { cn } from '@/lib/utils';
import { UserType, UserStatus, JobStatus, ReportStatus, EventStatus, MentorshipStatus } from '@/types';

type BadgeVariant = UserType | UserStatus | JobStatus | ReportStatus | EventStatus | MentorshipStatus;

interface StatusBadgeProps {
    variant: BadgeVariant;
    className?: string;
}

const badgeStyles: Record<string, string> = {
    // User Types
    Junior: 'bg-blue-100 text-blue-700',
    Senior: 'bg-indigo-100 text-indigo-700',
    Alumni: 'bg-violet-100 text-violet-700',

    // User Status
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',

    // Job Status
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',

    // Report Status
    Resolved: 'bg-green-100 text-green-700',
    Escalated: 'bg-red-100 text-red-700',

    // Event Status
    Upcoming: 'bg-blue-100 text-blue-700',
    Ongoing: 'bg-amber-100 text-amber-700',
    Completed: 'bg-gray-100 text-gray-700',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, className }) => {
    return (
        <span className={cn('badge', badgeStyles[variant], className)}>
            {variant}
        </span>
    );
};

export default StatusBadge;
