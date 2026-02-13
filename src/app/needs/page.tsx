'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import AdminNeedModal from '@/components/AdminNeedModal';
import { Need, SKILL_CATEGORIES, SkillCategory, NeedResponse } from '@/types';
import { CATEGORY_ICONS, getCategoryIcon } from '@/constants/icons';
import GlassIcon from '@/components/GlassIcon';
import { Search, X, ChevronRight, Plus, ClipboardList } from 'lucide-react';

interface CategoryStat {
  category: SkillCategory;
  count: number;
}

export default function NeedsBoardPage() {
  const { user, isAdmin } = useAuth();
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [userResponses, setUserResponses] = useState<NeedResponse[]>([]);
  const [isAddNeedModalOpen, setIsAddNeedModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();

      const [needsRes, responsesRes] = await Promise.all([
        fetch('/api/needs', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }),
        token ? fetch(`/api/need-responses?userOnly=true`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }) : Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false }) })
      ]);

      const needsData = await needsRes.json();

      if (needsData.success) {
        setNeeds(needsData.data.needs);
        setCategoryStats(needsData.data.categoryStats);
      }

      // Handle user responses if logged in
      if (token && responsesRes.ok) {
        const responsesData = await responsesRes.json();
        if (responsesData.success) {
          setUserResponses(responsesData.data.responses);
        }
      }
    } catch (error) {
      console.error('Error fetching needs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, [user]);

  // Memoized filtering for both category and search query
  const filteredNeeds = useMemo(() => {
    let result = needs;

    // Filter by category if selected
    if (selectedCategory) {
      result = result.filter(n => n.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [needs, selectedCategory, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNeeds.length / itemsPerPage);
  const paginatedNeeds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNeeds.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNeeds, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 mt-20 sm:mt-24 space-y-8">
          {/* Header Section */}
          {/* Header Section */}
          <div className="animate-fadeIn mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-4xl font-bold text-[#00245D] tracking-tight">
                Needs Board
              </h1>
              {isAdmin && (
                <button
                  onClick={() => setIsAddNeedModalOpen(true)}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Need
                </button>
              )}
            </div>
            <p className="mt-2 text-lg text-[#00245D]/70 font-medium max-w-2xl">Browse community needs by category and see where you can help.</p>
          </div>

          {/* Search Bar */}
          <div className="animate-fadeIn">
            <div className="glass-panel relative transition-all duration-300 group focus-within:ring-4 focus-within:ring-[#99D6EA]/20 max-w-3xl">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00245D]/50 group-focus-within:text-[#00245D] transition-colors">
                <Search size={24} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search needs by title, description, or category..."
                className="w-full pl-16 pr-14 py-4 border-0 rounded-2xl focus:ring-0 focus:outline-none text-[#00245D] placeholder-[#00245D]/40 bg-transparent font-medium text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[#00245D]/10 text-[#00245D]/40 hover:text-[#00245D] transition-all"
                  title="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-4 text-sm font-medium text-[#00245D]/60 animate-fadeIn ml-2">
                Found {filteredNeeds.length} {filteredNeeds.length === 1 ? 'result' : 'results'} for <span className="text-[#00245D] font-bold">&quot;{searchQuery}&quot;</span>
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <>
              {/* Category Tiles */}
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#00245D]">Categories</h2>
                  <span className="text-xs font-semibold text-[#00245D]/40 uppercase tracking-wider">Filter by</span>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${selectedCategory === null
                      ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/25 ring-2 ring-[#00245D] ring-offset-2 ring-offset-[#E6F0F6]'
                      : 'glass-panel hover:bg-white/40 text-[#00245D] border-white/40'
                      }`}
                  >
                    All Needs <span className={`ml-1.5 text-xs ${selectedCategory === null ? 'opacity-80' : 'opacity-60'}`}>({needs.length})</span>
                  </button>
                  {categoryStats.map((stat, i) => (
                    <button
                      key={stat.category}
                      onClick={() => setSelectedCategory(stat.category)}
                      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 ${selectedCategory === stat.category
                        ? `${getCategoryColor(stat.category)} text-white shadow-lg ring-2 ring-offset-2 ring-offset-[#E6F0F6] ring-opacity-50`
                        : 'glass-panel hover:bg-white/40 text-[#00245D] border-white/40'
                        }`}
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <GlassIcon icon={getCategoryIcon(stat.category)} size="sm" variant="primary" className="!bg-transparent !shadow-none !text-current !p-0 !w-auto !h-auto" />
                      {stat.category}
                      <span className={`text-xs ml-1 ${selectedCategory === stat.category ? 'text-white/80' : 'text-[#00245D]/40'}`}>
                        {stat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Needs List */}
              <div>
                <h2 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-3">
                  {selectedCategory ? `${selectedCategory} Needs` : 'All Needs'}
                  <span className="text-xs font-bold text-[#00245D]/60 bg-[#00245D]/5 px-3 py-1 rounded-full border border-[#00245D]/5">{filteredNeeds.length} results</span>
                </h2>

                {filteredNeeds.length === 0 ? (
                  <div className="glass-panel p-16 text-center flex flex-col items-center animate-fadeIn">
                    <div className="w-20 h-20 bg-[#00245D]/5 rounded-full flex items-center justify-center text-[#00245D]/40 mb-6">
                      <Search size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[#00245D] mb-2">No active needs found</h3>
                    <p className="text-[#00245D]/60 text-lg max-w-md mx-auto">None of the active needs match your current filters. Try selecting a different category or clearing your search.</p>
                    {isAdmin && (
                      <button
                        onClick={() => setIsAddNeedModalOpen(true)}
                        className="mt-8 btn-primary inline-flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Add New Need
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {paginatedNeeds.map((need, i) => {
                        const userResponse = userResponses.find(r => r.needId === need.id);
                        return (
                          <Link key={need.id} href={`/needs/${need.id}`} className="group glass-panel p-6 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fadeIn relative flex flex-col h-full" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-14 h-14 ${getCategoryColor(need.category)} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-white`}>
                                <GlassIcon icon={getCategoryIcon(need.category)} size="lg" variant="primary" className="!bg-transparent !shadow-none !text-white" />
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00245D]/60 bg-[#00245D]/5 px-2 py-1 rounded-md border border-[#00245D]/5">{need.category}</span>
                                {userResponse && (
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-sm uppercase tracking-wider ${userResponse.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    userResponse.status === 'declined' ? 'bg-red-100 text-red-700 border border-red-200' :
                                      userResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                    {userResponse.status === 'accepted' ? 'Accepted' :
                                      userResponse.status === 'declined' ? 'Declined' :
                                        userResponse.status === 'reviewed' ? 'Reviewed' :
                                          'Pending'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="font-bold text-[#00245D] text-lg leading-tight group-hover:text-[#003380] transition-colors mb-2 line-clamp-2">{need.title}</h3>
                            <p className="text-sm text-[#00245D]/70 line-clamp-3 mb-6 flex-1 leading-relaxed">{need.description}</p>
                            <div className="mt-auto pt-4 border-t border-white/20 flex items-center justify-between text-[#00245D] text-sm font-bold">
                              <span>{userResponse ? 'View Status' : 'View Details'}</span>
                              <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center group-hover:bg-[#00245D] group-hover:text-white transition-colors">
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    <Pagination
                      currentPage={currentPage}
                      totalItems={filteredNeeds.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      className="mt-8"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </main>

        {/* Admin Add Need Modal */}
        <AdminNeedModal
          isOpen={isAddNeedModalOpen}
          onClose={() => setIsAddNeedModalOpen(false)}
          onSuccess={fetchNeeds}
        />
      </div>
    </ProtectedRoute>
  );
}


