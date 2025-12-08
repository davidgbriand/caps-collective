'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StrengthMeter from '@/components/StrengthMeter';
import { SearchResult } from '@/types';

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    setLoading(true);
    setSearched(true);

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

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">🔍</span>
              Search
            </h1>
            <p className="mt-2 text-[#00245D]/60">Find community members by skills, connections, or organizations.</p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3 bg-white/95 backdrop-blur-sm p-2 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 border border-[#D4C4A8]">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00245D]/40">🔍</span>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for skills, organizations, sectors..." className="w-full pl-12 pr-4 py-4 border-0 rounded-xl focus:ring-0 focus:outline-none text-[#00245D] placeholder-[#00245D]/40 bg-transparent" />
              </div>
              <button type="submit" disabled={loading || query.length < 2} className="px-8 py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:shadow-[#00245D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Searching</span> : 'Search'}
              </button>
            </div>
          </form>

          {searched && (
            <div className="animate-fadeIn">
              <h2 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                Results <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{results.length} found</span>
              </h2>

              {results.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#00245D]/60 text-lg">No results found for &quot;{query}&quot;</p>
                  <p className="text-[#00245D]/40 text-sm mt-2">Try different keywords or check spelling</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, i) => (
                    <div
                      key={result.userId}
                      onClick={() => router.push(`/users/${result.userId}`)}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#00245D] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(result.userName || 'U')[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#00245D] text-lg">{result.userName || 'Community Member'}</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {result.matchedSkills.slice(0, 3).map(skill => (
                                <span key={skill.id} className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-lg text-sm font-medium">⚽ {skill.skillName}</span>
                              ))}
                              {result.matchedConnections.slice(0, 2).map(conn => (
                                <span key={conn.id} className="bg-[#00245D]/10 text-[#00245D] px-3 py-1 rounded-lg text-sm font-medium">🤝 {conn.organizationName}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <StrengthMeter strength={result.strengthMeter} size="lg" />
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D4C4A8] flex items-center gap-4 text-sm text-[#00245D]/60">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00245D] rounded-full"></span>{result.matchDetails.directSkillMatches} skills</span>
                        {result.matchDetails.connectionMatches > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#99D6EA] rounded-full"></span>{result.matchDetails.connectionMatches} connections</span>}
                        {result.matchDetails.hobbySkillMatches > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00245D]/50 rounded-full"></span>{result.matchDetails.hobbySkillMatches} hobbies</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}


