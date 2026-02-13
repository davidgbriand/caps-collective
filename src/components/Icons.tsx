import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    strokeWidth?: number;
}

export const IconBase = ({ size = 20, strokeWidth = 1.5, children, ...props }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {children}
    </svg>
);

export const SparklesIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </IconBase>
);

export const XIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </IconBase>
);

export const ChevronDownIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="m6 9 6 6 6-6" />
    </IconBase>
);

export const MapPinIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </IconBase>
);

export const CalendarIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
    </IconBase>
);

export const TextIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M17 6.1H3" />
        <path d="M21 12.1H3" />
        <path d="M15.1 18H3" />
    </IconBase>
);

export const ListChecksIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M10 6h11" />
        <path d="M10 12h11" />
        <path d="M10 18h11" />
        <path d="M4 6h1" />
        <path d="M4 12h1" />
        <path d="M4 18h1" />
    </IconBase>
);

export const ClipboardListIcon = (props: IconProps) => (
    <IconBase {...props}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
    </IconBase>
);

export const PlusIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </IconBase>
);

export const UsersIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
);

export const ChartBarIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-6" />
    </IconBase>
);

export const CurrencyDollarIcon = (props: IconProps) => (
    <IconBase {...props}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </IconBase>
);

export const UserGroupIcon = (props: IconProps) => (
    <IconBase {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="13" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
);

export const ClipboardDocumentCheckIcon = (props: IconProps) => (
    <IconBase {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        <polyline points="12 15 15 18 21 12" />
    </IconBase>
);
