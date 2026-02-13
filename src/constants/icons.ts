import {
    Trophy,
    Sprout,
    PartyPopper,
    Warehouse,
    BookOpen,
    Stethoscope,
    Laptop,
    Video,
    Megaphone,
    Coins,
    Gavel,
    Wrench,
    House,
    Briefcase,
    Palette,
    Heart,
    Landmark,
    ClipboardList,
    LucideIcon
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    'Sports & Coaching': Trophy,
    'Youth Development': Sprout,
    'Event Planning': PartyPopper,
    'Facilities & Equipment': Warehouse,
    'Education': BookOpen,
    'Healthcare': Stethoscope,
    'Technology': Laptop,
    'Media': Video,
    'Marketing': Megaphone,
    'Finance': Coins,
    'Legal': Gavel,
    'Trades': Wrench,
    'Real Estate': House,
    'Consulting': Briefcase,
    'Arts & Entertainment': Palette,
    'Non-Profit': Heart,
    'Government': Landmark,
    'Other': ClipboardList,
};

export const getCategoryIcon = (category: string): LucideIcon => {
    return CATEGORY_ICONS[category] || ClipboardList;
};
