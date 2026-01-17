import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, className }) => {
    return (
        <div className={cn('stat-card', className)}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {trend && (
                        <p className={cn(
                            'text-sm mt-2 flex items-center',
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                            <span>{trend.isPositive ? '↑' : '↓'} {trend.value}</span>
                            <span className="text-gray-500 ml-1">vs last week</span>
                        </p>
                    )}
                </div>
                <div className="ml-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                        <Icon className="w-6 h-6 text-primary-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
