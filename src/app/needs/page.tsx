'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Need, SkillCategory } from '@/types';

interface CategoryStat {
  category: SkillCategory;
  count: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Sports & Coaching': '⚽',
  'Youth Development': '🌱',
  'Event Planning': '🎉',
  'Facilities & Equipment': '🏟️',
  'Education': '📚',
  'Healthcare': '🏥',
  'Technology': '💻',
  'Media': '📺',
  'Marketing': '📢',
  'Finance': '💰',
  'Legal': '⚖️',
  'Trades': '🔧',
  'Real Estate': '🏠',
  'Consulting': '💼',
  'Arts & Entertainment': '🎨',
  'Non-Profit': '❤️',
  'Government': '🏛️',
  'Other': '📋',
};

export default function NeedsBoardPage() {
  const { user } = useAuth();
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNeeds() {
      try {
        const token = await user?.getIdToken();
        const response = await fetch('/api/needs', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setNeeds(data.data.needs);
          setCategoryStats(data.data.categoryStats);
        }
      } catch (error) {
        console.error('Error fetching needs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNeeds();
  }, [user]);

  const filteredNeeds = selectedCategory
    ? needs.filter(n => n.category === selectedCategory)
    : needs;

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Sports & Coaching': 'bg-[#00245D]',
      'Youth Development': 'bg-[#99D6EA]',
      'Event Planning': 'bg-[#00245D]',
      'Facilities & Equipment': 'bg-[#99D6EA]',
      'Education': 'bg-[#99D6EA]',
      'Healthcare': 'bg-[#00245D]',
      'Technology': 'bg-[#00245D]',
      'Media': 'bg-[#00245D]',
      'Marketing': 'bg-[#99D6EA]',
      'Finance': 'bg-[#99D6EA]',
      'Legal': 'bg-[#00245D]',
      'Trades': 'bg-[#99D6EA]',
      'Real Estate': 'bg-[#00245D]',
      'Consulting': 'bg-[#00245D]',
      'Arts & Entertainment': 'bg-[#99D6EA]',
      'Non-Profit': 'bg-[#00245D]',
      'Government': 'bg-[#99D6EA]',
    };
    return colors[cat] || 'bg-[#00245D]';
  };

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">📋</span>
              Needs Board
            </h1>
            <p className="mt-2 text-[#00245D]/60">Browse community needs by category and see where you can help.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <>
              {/* Category Tiles */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#00245D] mb-4">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <button onClick={() => setSelectedCategory(null)} className={`p-4 rounded-2xl text-center transition-all hover:-translate-y-1 ${selectedCategory === null ? 'bg-[#00245D] text-white shadow-xl shadow-[#00245D]/25' : 'bg-white/95 backdrop-blur-sm border border-[#D4C4A8] hover:shadow-xl shadow-lg'}`}>
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-semibold text-sm">All</div>
                    <div className={`text-xs mt-1 ${selectedCategory === null ? 'text-[#99D6EA]' : 'text-[#00245D]/60'}`}>{needs.length} needs</div>
                  </button>
                  {categoryStats.map((stat, i) => (
                    <button key={stat.category} onClick={() => setSelectedCategory(stat.category)} className={`p-4 rounded-2xl text-center transition-all hover:-translate-y-1 animate-fadeIn ${selectedCategory === stat.category ? `${getCategoryColor(stat.category)} text-white shadow-xl` : 'bg-white/95 backdrop-blur-sm border border-[#D4C4A8] hover:shadow-xl shadow-lg'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="text-2xl mb-2">{CATEGORY_ICONS[stat.category] || '📋'}</div>
                      <div className={`font-semibold text-sm ${selectedCategory === stat.category ? 'text-white' : 'text-[#00245D]'}`}>{stat.category}</div>
                      <div className={`text-xs mt-1 ${selectedCategory === stat.category ? 'text-white/80' : 'text-[#00245D]/60'}`}>{stat.count} needs</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Needs List */}
              <div>
                <h2 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                  {selectedCategory ? `${selectedCategory} Needs` : 'All Needs'}
                  <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{filteredNeeds.length} results</span>
                </h2>

                {filteredNeeds.length === 0 ? (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-[#00245D]/60 text-lg">No active needs in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNeeds.map((need, i) => (
                      <Link key={need.id} href={`/needs/${need.id}`} className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 ${getCategoryColor(need.category)} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>{CATEGORY_ICONS[need.category] || '📋'}</div>
                          <span className="text-xs font-medium text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{need.category}</span>
                        </div>
                        <h3 className="font-bold text-[#00245D] text-lg group-hover:text-[#00245D]/70 transition-colors">{need.title}</h3>
                        <p className="mt-2 text-sm text-[#00245D]/60 line-clamp-2">{need.description}</p>
                        <div className="mt-4 flex items-center text-[#00245D] text-sm font-medium">
                          View matches <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}


