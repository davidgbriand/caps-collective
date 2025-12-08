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

export default function AdminNeedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<CapsScoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<CapsScoreResult | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    async function fetchNeedData() {
      if (!params.id || !user) return;

      try {
        // Fetch the need
        const needDoc = await getDoc(doc(db, 'needs', params.id as string));
        if (!needDoc.exists()) {
          router.push('/admin');
          return;
        }

        const needData = { id: needDoc.id, ...needDoc.data() } as Need;
        setNeed(needData);

        const token = await user.getIdToken();

        // Fetch matches
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
        console.error('Error fetching need data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNeedData();
  }, [params.id, router, user]);

  const handleDeleteNeed = async () => {
    if (!user || !need || !confirm('Are you sure you want to delete this need? This action cannot be undone.')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/needs?needId=${need.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete need');
    }
  };

  const handleToggleStatus = async () => {
    if (!user || !need) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/needs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId: need.id,
          userId: user.uid,
          isActive: !need.isActive,
        }),
      });

      setNeed({ ...need, isActive: !need.isActive });
    } catch (error) {
      console.error('Error toggling need status:', error);
    }
  };

  const handleContactUser = (match: CapsScoreResult) => {
    setSelectedMatch(match);
    setShowContactModal(true);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    alert('Email copied to clipboard!');
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-pattern">
          <Navbar />
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!need) return null;

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => router.push('/admin')} className="mb-6 text-[#00245D] hover:text-[#00245D]/70 font-semibold flex items-center gap-2 hover:-translate-x-1 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Admin Panel
          </button>

          {/* Need Details Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 p-8 border border-[#D4C4A8] animate-fadeIn mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <span className="text-sm text-[#00245D] font-semibold bg-[#99D6EA]/30 px-4 py-1.5 rounded-full">{need.category}</span>
                <h1 className="mt-4 text-3xl font-bold text-[#00245D]">{need.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                {need.isActive ? (
                  <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Active
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold">Closed</span>
                )}
              </div>
            </div>
            <div className="prose max-w-none mb-6">
              <p className="text-[#00245D]/70 text-lg leading-relaxed">{need.description}</p>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-3 pt-6 border-t border-[#D4C4A8]">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${need.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              >
                {need.isActive ? '⏸️ Close Need' : '▶️ Reopen Need'}
              </button>
              <button
                onClick={handleDeleteNeed}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-xl font-medium hover:bg-red-200 transition-all"
              >
                🗑️ Delete Need
              </button>
            </div>
          </div>

	          {/* Top Matches Section */}
	          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 p-8 border border-[#D4C4A8] animate-fadeIn">
	            <h2 className="text-2xl font-bold text-[#00245D] mb-6 flex items-center gap-2">
	              🏆 Top CAPS Score Matches
	              <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">
	                {matches.length} found
	              </span>
	            </h2>
	
	            {matches.length === 0 ? (
	              <div className="text-center py-12">
	                <div className="text-5xl mb-4">🔍</div>
	                <p className="text-[#00245D]/60 text-lg">No matches found for this need yet. Users need to add skills in this category to appear as matches.</p>
	              </div>
	            ) : (
              <div className="space-y-4">
                {matches.map((match, index) => (
                  <div key={match.userId} className="bg-[#D4C4A8]/20 rounded-2xl p-5 border border-[#D4C4A8] flex items-center justify-between animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-[#00245D]'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#00245D] text-lg">{match.userName || 'Community Member'}</p>
                        <p className="text-sm text-[#00245D]/60">{match.userEmail}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#00245D]/60">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-[#00245D] rounded-full"></span>
                            {match.matchDetails.directSkillMatches} skills
                          </span>
                          {match.matchDetails.connectionMatches > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#99D6EA] rounded-full"></span>
                              {match.matchDetails.connectionMatches} connections
                            </span>
                          )}
                          {match.matchDetails.hobbySkillMatches > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#D4C4A8] rounded-full"></span>
                              {match.matchDetails.hobbySkillMatches} hobbies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StrengthMeter strength={match.strengthMeter} size="lg" />
                      <button
                        onClick={() => handleContactUser(match)}
	                        className="px-4 py-2 bg-[#00245D] text-white rounded-xl font-medium hover:bg-[#00245D]/90 transition-all whitespace-nowrap"
                      >
	                        📧 Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

	          {/* Contact Modal */}
	          {showContactModal && selectedMatch && (
	            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
	                <div className="flex items-center justify-between mb-2">
	                  <h3 className="text-2xl font-bold text-[#00245D]">📧 Contact User</h3>
	                  <button
	                    onClick={() => setShowContactModal(false)}
	                    className="text-[#00245D]/60 hover:text-[#00245D] text-2xl"
	                  >
	                    ✕
	                  </button>
	                </div>
	                <p className="text-sm text-[#00245D]/60 mb-4">
	                  Contact this member about the opportunity.
	                </p>

	                <div className="space-y-4 mb-6">
	                  <div className="flex justify-center mb-4">
	                    {selectedMatch.userProfilePhoto ? (
	                      <img
	                        src={selectedMatch.userProfilePhoto}
	                        alt={selectedMatch.userName}
	                        className="w-20 h-20 rounded-full object-cover border-2 border-[#D4C4A8]"
	                      />
	                    ) : (
	                      <div className="w-20 h-20 bg-[#00245D] rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-[#D4C4A8]">
	                        <span>{(selectedMatch.userName || selectedMatch.userEmail || 'U')[0].toUpperCase()}</span>
	                      </div>
	                    )}
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-1">Name</p>
	                    <p className="text-lg font-bold text-[#00245D]">{selectedMatch.userName || 'Community Member'}</p>
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-1">Email</p>
	                    <div className="flex items-center gap-2">
	                      <p className="text-sm font-mono text-[#00245D] break-all">{selectedMatch.userEmail}</p>
	                      <button
	                        onClick={() => handleCopyEmail(selectedMatch.userEmail)}
	                        className="px-3 py-1 bg-[#99D6EA] text-[#00245D] rounded-lg text-sm font-medium hover:bg-[#99D6EA]/80 transition-all whitespace-nowrap"
	                      >
	                        📋 Copy
	                      </button>
	                    </div>
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-1">Phone</p>
	                    {selectedMatch.userPhoneNumber ? (
	                      <a href={`tel:${selectedMatch.userPhoneNumber}`} className="text-lg font-mono text-[#00245D] hover:text-[#00245D]/70 transition-colors">
	                        {selectedMatch.userPhoneNumber}
	                      </a>
	                    ) : (
	                      <p className="text-sm text-[#00245D]/40">Phone not provided</p>
	                    )}
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-1">About</p>
	                    {selectedMatch.userBio ? (
	                      <p className="text-sm text-[#00245D]/80 leading-relaxed">{selectedMatch.userBio}</p>
	                    ) : (
	                      <p className="text-sm text-[#00245D]/40">No bio provided</p>
	                    )}
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-1">Match Score</p>
	                    <div className="flex items-center gap-2">
	                      <div className="flex-1 bg-[#D4C4A8]/30 rounded-full h-2">
	                        <div
	                          className="bg-[#00245D] h-2 rounded-full transition-all"
	                          style={{ width: `${(selectedMatch.strengthMeter / 5) * 100}%` }}
	                        ></div>
	                      </div>
	                      <span className="text-lg font-bold text-[#00245D]">{selectedMatch.strengthMeter}/5</span>
	                    </div>
	                  </div>

	                  <div>
	                    <p className="text-sm text-[#00245D]/60 font-semibold mb-2">Match Details</p>
	                    <div className="space-y-1 text-sm text-[#00245D]/70">
	                      <p>✓ {selectedMatch.matchDetails.directSkillMatches} Direct Skill Match{selectedMatch.matchDetails.directSkillMatches !== 1 ? 'es' : ''}</p>
	                      {selectedMatch.matchDetails.hobbySkillMatches > 0 && (
	                        <p>✓ {selectedMatch.matchDetails.hobbySkillMatches} Hobby Skill Match{selectedMatch.matchDetails.hobbySkillMatches !== 1 ? 'es' : ''}</p>
	                      )}
	                      {selectedMatch.matchDetails.connectionMatches > 0 && (
	                        <p>✓ {selectedMatch.matchDetails.connectionMatches} Connection Match{selectedMatch.matchDetails.connectionMatches !== 1 ? 'es' : ''}</p>
	                      )}
	                    </div>
	                  </div>
	                </div>

		                <div className="flex gap-3">
		                  {/* Email sending temporarily disabled */}
		                  {/**
		                  <a
		                    href={`mailto:${selectedMatch.userEmail}?subject=Opportunity: ${need?.title}`}
		                    className="flex-1 px-4 py-3 bg-[#00245D] text-white rounded-xl font-medium hover:bg-[#00245D]/90 transition-all text-center"
		                  >
		                    ✉️ Send Email
		                  </a>
		                  **/}
	                  <button
	                    onClick={() => setShowContactModal(false)}
	                    className="flex-1 px-4 py-3 bg-[#D4C4A8]/30 text-[#00245D] rounded-xl font-medium hover:bg-[#D4C4A8]/50 transition-all"
	                  >
	                    Close
	                  </button>
	                </div>
	              </div>
	            </div>
	          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

