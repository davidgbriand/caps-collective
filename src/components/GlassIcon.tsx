import { LucideIcon } from 'lucide-react';

interface GlassIconProps {
    icon: LucideIcon;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'success';
}

export default function GlassIcon({
    icon: Icon,
    size = 'md',
    className = '',
    variant = 'primary'
}: GlassIconProps) {

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm p-1.5',
        md: 'w-10 h-10 text-base p-2',
        lg: 'w-12 h-12 text-lg p-2.5',
        xl: 'w-16 h-16 text-2xl p-3' // Increased padding for larger icon
    };

    const variantClasses = {
        primary: 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20',
        secondary: 'bg-[#99D6EA] text-[#00245D] shadow-lg shadow-[#99D6EA]/20',
        accent: 'bg-[#D4C4A8] text-[#00245D] shadow-lg shadow-[#D4C4A8]/20',
        danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20',
        warning: 'bg-amber-400 text-[#00245D] shadow-lg shadow-amber-400/20',
        success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
    };

    return (
        <div className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-2xl flex items-center justify-center shrink-0 ${className}`}>
            <Icon className="w-full h-full" strokeWidth={2} />
        </div>
    );
}
