import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export const Card: React.FC<CardProps> = ({ title, className, children, ...props }) => (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props}>
        {title && <div className="border-b px-4 py-2 font-medium">{title}</div>}
        <div className="p-4">{children}</div>
    </div>
);
