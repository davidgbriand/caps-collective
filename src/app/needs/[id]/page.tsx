'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StrengthMeter from '@/components/StrengthMeter';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Need, CapsScoreResult } from '@/types';

export default function NeedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<CapsScoreResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNeedAndMatches() {
      if (!params.id || !user) return;

      try {
        // Fetch the need
        const needDoc = await getDoc(doc(db, 'needs', params.id as string));
        if (!needDoc.exists()) {
          router.push('/needs');
          return;
        }

        const needData = { id: needDoc.id, ...needDoc.data() } as Need;
        setNeed(needData);

        // Fetch matches with authentication token
        const token = await user.getIdToken();
        const matchResponse = await fetch(`/api/caps-score?category=${needData.category}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const matchData = await matchResponse.json();

        if (matchData.success) {
          setMatches(matchData.data);
        }
      } catch (error) {
        console.error('Error fetching need:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNeedAndMatches();
  }, [params.id, router, user]);


  if (loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern">
          <Navbar />
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!need) return null;

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => router.back()} className="mb-6 text-[#00245D] hover:text-[#00245D]/70 font-semibold flex items-center gap-2 hover:-translate-x-1 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Needs
          </button>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 p-8 border border-[#D4C4A8] animate-fadeIn">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-sm text-[#00245D] font-semibold bg-[#99D6EA]/30 px-4 py-1.5 rounded-full">{need.category}</span>
                <h1 className="mt-4 text-3xl font-bold text-[#00245D]">{need.title}</h1>
              </div>
              {need.isActive ? (
                <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Active</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold">Closed</span>
              )}
            </div>
            <div className="prose max-w-none"><p className="text-[#00245D]/70 text-lg leading-relaxed">{need.description}</p></div>
          </div>

	          {/* Top Matches - Only visible to admins */}
	          {isAdmin && (
	            <div className="mt-8">
	              <h2 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">🏆 Top Matches <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{matches.length} found</span></h2>
	
	              {matches.length === 0 ? (
	                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
	                  <div className="text-5xl mb-4">🔍</div>
	                  <p className="text-[#00245D]/60 text-lg">No matches found for this need yet. Users need to add skills in this category to appear as matches.</p>
	                </div>
	              ) : (
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div key={match.userId} className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-between animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-[#00245D]'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#00245D] text-lg">{match.userName || 'Community Member'}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-[#00245D]/60">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00245D] rounded-full"></span>{match.matchDetails.directSkillMatches} skills</span>
                            {match.matchDetails.hobbySkillMatches > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#99D6EA] rounded-full"></span>{match.matchDetails.hobbySkillMatches} hobbies</span>}
                          </div>
                        </div>
                      </div>
                      <StrengthMeter strength={match.strengthMeter} size="lg" />
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

