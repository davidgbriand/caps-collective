'use client';

interface StrengthMeterProps {
  strength: number; // 1-5
  size?: 'sm' | 'md' | 'lg';
}

export default function StrengthMeter({ strength, size = 'md' }: StrengthMeterProps) {
  const containerSizes = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-1.5' };
  const barSizes = { sm: 'h-4 w-1.5', md: 'h-6 w-2', lg: 'h-8 w-2.5' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  const getGradient = (level: number) => {
    if (level > strength) return 'bg-gray-200';
    if (strength <= 1) return 'bg-gradient-to-t from-red-500 to-red-400';
    if (strength === 2) return 'bg-gradient-to-t from-orange-500 to-orange-400';
    if (strength === 3) return 'bg-gradient-to-t from-yellow-500 to-yellow-400';
    if (strength === 4) return 'bg-gradient-to-t from-lime-500 to-lime-400';
    return 'bg-gradient-to-t from-green-600 to-green-400';
  };

  // Map numeric strength (1-5) to labels used in the UI design:
  // Excellent / Good / Fair / Weak (from strongest to weakest)
  const getLabel = () => {
    if (strength >= 5) return 'Excellent';
    if (strength === 4) return 'Good';
    if (strength === 3) return 'Fair';
    return 'Weak'; // 1-2
  };

  const getLabelColor = () => {
    if (strength >= 5) return 'text-green-600 bg-green-50';
    if (strength === 4) return 'text-lime-600 bg-lime-50';
    if (strength === 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-end ${containerSizes[size]}`}>
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={`rounded-full ${barSizes[size]} ${getGradient(level)} transition-all shadow-sm`} style={{ height: size === 'lg' ? `${12 + level * 4}px` : size === 'md' ? `${8 + level * 3}px` : `${6 + level * 2}px` }} />
        ))}
      </div>
      <span className={`${textSizes[size]} font-semibold px-2 py-0.5 rounded-lg ${getLabelColor()}`}>{getLabel()}</span>
    </div>
  );
}

