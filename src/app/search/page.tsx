
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Need } from '@/types';

import { CATEGORY_ICONS, getCategoryIcon } from '@/constants/icons';
import GlassIcon from '@/components/GlassIcon';
import { Search, X, ChevronRight, User, ClipboardList, Lightbulb } from 'lucide-react';

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

interface PersonResult {
  id: string;
  displayName: string;
  profilePhoto?: string;
  matchedSkill?: string;
}

interface SearchResults {
  people: PersonResult[];
  needs: Need[];
}

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ people: [], needs: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'skills' | 'needs'>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    setLoading(true);
    setSearched(true);
    setActiveTab('all'); // Reset to 'all' on new search

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to clear search
  const clearSearch = () => {
    setQuery('');
    setSearched(false);
    setResults({ people: [], needs: [] });
  };

  // Derived counts and lists
  const skillCount = results.people.filter(p => !!p.matchedSkill).length;
  const peopleCount = results.people.length;
  const needsCount = results.needs.length;
  const totalCount = peopleCount + needsCount;

  // Sorting: Prioritize people with matchedSkill
  const sortedPeople = [...results.people].sort((a, b) => {
    // Prioritize skill match over name match
    if (a.matchedSkill && !b.matchedSkill) return -1;
    if (!a.matchedSkill && b.matchedSkill) return 1;
    return 0; // Keep original alphabetical order within groups
  });

  // Filter based on active tab
  let displayedPeople = sortedPeople;
  if (activeTab === 'skills') {
    displayedPeople = sortedPeople.filter(p => !!p.matchedSkill);
  } else if (activeTab === 'people') {
    displayedPeople = sortedPeople; // Show everyone in "People" tab
  }

  // Determine if we show people section
  const showPeople = (activeTab === 'all' || activeTab === 'people' || activeTab === 'skills') && displayedPeople.length > 0;
  // Determine if we show needs section
  const showNeeds = (activeTab === 'all' || activeTab === 'needs') && needsCount > 0;


  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 mt-20 sm:mt-24">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-4xl font-bold text-[#00245D] tracking-tight">
              Search
            </h1>
            <p className="mt-2 text-lg text-[#00245D]/70 font-medium max-w-2xl">Find community needs, people, and skills.</p>
          </div>

          {/* Search Bar */}
          <div className="animate-fadeIn mb-8 relative z-10">
            <form onSubmit={handleSearch} className="glass-panel relative transition-all duration-300 group focus-within:ring-4 focus-within:ring-[#99D6EA]/20 max-w-3xl">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00245D]/50 group-focus-within:text-[#00245D] transition-colors">
                <Search size={24} />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for people, skills, or needs (e.g., 'Kim', 'Carpentry', 'Event')..."
                className="w-full pl-16 pr-14 py-4 border-0 rounded-2xl focus:ring-0 focus:outline-none text-[#00245D] placeholder-[#00245D]/40 bg-transparent font-medium text-lg"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[#00245D]/10 text-[#00245D]/40 hover:text-[#00245D] transition-all"
                  title="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </form>
          </div>

          {/* Results Area */}
          {searched && (
            <div className="animate-fadeIn">

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-6 border-b border-[#00245D]/10 pb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'all'
                    ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20'
                    : 'text-[#00245D]/60 hover:bg-[#00245D]/5 hover:text-[#00245D]'
                    }`}
                >
                  All Results <span className="opacity-80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{totalCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('people')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'people'
                    ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20'
                    : 'text-[#00245D]/60 hover:bg-[#00245D]/5 hover:text-[#00245D]'
                    }`}
                >
                  <User size={16} />
                  People <span className="opacity-80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{peopleCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'skills'
                    ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20'
                    : 'text-[#00245D]/60 hover:bg-[#00245D]/5 hover:text-[#00245D]'
                    }`}
                >
                  <Lightbulb size={16} />
                  Skills <span className="opacity-80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{skillCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('needs')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'needs'
                    ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20'
                    : 'text-[#00245D]/60 hover:bg-[#00245D]/5 hover:text-[#00245D]'
                    }`}
                >
                  <ClipboardList size={16} />
                  Needs <span className="opacity-80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{needsCount}</span>
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
              ) : totalCount === 0 ? (
                <div className="glass-panel text-center py-16 px-6 max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00245D]/5 mb-6 text-[#00245D]/40">
                    <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#00245D] mb-2">No results found for &quot;{query}&quot;</h3>
                  <p className="text-[#00245D]/60 text-lg">Try checking for typos or performing a broader search.</p>
                </div>
              ) : (
                <div className="space-y-8">

                  {/* Unified People Section */}
                  {showPeople && (
                    <section>
                      {activeTab === 'all' && <h3 className="text-xl font-bold text-[#00245D] mb-4">People</h3>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedPeople.map((person, i) => (
                          <div
                            key={person.id}
                            onClick={() => router.push(`/users/${person.id}`)}
                            className="glass-panel p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer flex items-center gap-4 animate-fadeIn"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          >
                            <div className="w-16 h-16 bg-[#00245D] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden shrink-0">
                              {person.profilePhoto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={person.profilePhoto} alt={person.displayName} className="w-full h-full object-cover" />
                              ) : (
                                person.displayName[0]
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#00245D] text-lg">{person.displayName}</h4>
                              {person.matchedSkill && (
                                <span className="inline-block mt-1 bg-[#99D6EA]/30 text-[#00245D] text-xs font-bold px-2 py-0.5 rounded-md">
                                  {person.matchedSkill}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Needs Section */}
                  {showNeeds && (
                    <section>
                      {(activeTab === 'all') && <h3 className="text-xl font-bold text-[#00245D] mb-4 mt-8">Needs</h3>}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {results.needs.map((need, i) => (
                          <div
                            key={need.id}
                            onClick={() => router.push(`/needs/${need.id}`)}
                            className="glass-panel p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer group"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 ${getCategoryColor(need.category)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-white`}>
                                <GlassIcon icon={getCategoryIcon(need.category)} size="md" variant="primary" className="!bg-transparent !shadow-none !text-white" />
                              </div>
                              <span className="text-xs font-medium text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">
                                {need.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-[#00245D] text-lg group-hover:text-[#00245D]/70 transition-colors">
                              {need.title}
                            </h3>
                            <p className="mt-2 text-sm text-[#00245D]/60 line-clamp-2">
                              {need.description}
                            </p>
                            <div className="mt-4 flex items-center text-[#00245D] text-sm font-medium">
                              View details
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
