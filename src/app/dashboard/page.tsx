'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection, Need, NeedResponse } from '@/types';
import GlassIcon from '@/components/GlassIcon';
import { Trophy, Handshake, ClipboardList } from 'lucide-react';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<Need[]>([]);
  const [userResponses, setUserResponses] = useState<NeedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch user's skills
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', user.uid));
        const skillsSnapshot = await getDocs(skillsQuery);
        setSkills(skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));

        // Fetch user's connections
        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        setConnections(connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection)));

        // Fetch recent needs
        const needsQuery = query(collection(db, 'needs'), where('isActive', '==', true));
        const needsSnapshot = await getDocs(needsQuery);
        const recentNeedsInitial = needsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));

        // Fetch user's responses
        const token = await user.getIdToken();
        const responsesRes = await fetch(`/api/need-responses?userOnly=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const responsesData = await responsesRes.json();
        let responses: NeedResponse[] = [];
        if (responsesData.success) {
          responses = responsesData.data.responses;
          setUserResponses(responses);
        }

        // Fetch needs for user responses if we have them
        let appliedNeeds: Need[] = [];
        if (responses.length > 0) {
          // Get unique need IDs from responses
          const appliedNeedIds = [...new Set(responses.map(r => r.needId))];

          if (appliedNeedIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < appliedNeedIds.length; i += 10) {
              chunks.push(appliedNeedIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const appliedNeedsQuery = query(collection(db, 'needs'), where(documentId(), 'in', chunk));
              const appliedSnapshot = await getDocs(appliedNeedsQuery);
              const chunkNeeds = appliedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));
              appliedNeeds = [...appliedNeeds, ...chunkNeeds];
            }
          }
        }

        // Merge applied needs with recent needs, prioritizing applied ones
        // Remove duplicates
        const allNeedsMap = new Map<string, Need>();
        appliedNeeds.forEach(n => allNeedsMap.set(n.id, n));
        recentNeedsInitial.forEach(n => {
          if (!allNeedsMap.has(n.id)) {
            allNeedsMap.set(n.id, n);
          }
        });

        // Convert map back to array
        const mergedNeeds = Array.from(allNeedsMap.values());

        // Take top 5 for display
        setRecentNeeds(mergedNeeds.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-[#00245D] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#00245D]/20 overflow-hidden">
                {userData?.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userData.profilePhoto} alt={userData?.displayName || "Profile"} className="w-full h-full object-cover" />
                ) : (
                  userData?.displayName?.[0] || 'M'
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#00245D]">Welcome back, {userData?.displayName || 'Member'}!</h1>
                <p className="text-[#00245D]/60">Here&apos;s an overview of your community involvement.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Skills', value: skills.length, icon: Trophy, variant: 'primary' as const },
                  { label: 'Connections', value: connections.length, icon: Handshake, variant: 'secondary' as const },
                  { label: 'Active Needs', value: recentNeeds.length, icon: ClipboardList, variant: 'primary' as const },
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex-shrink-0"><GlassIcon icon={stat.icon} size="lg" variant={stat.variant} /></div>
                    <div>
                      <div className="text-3xl font-bold text-[#00245D]">{stat.value}</div>
                      <div className="text-sm font-semibold text-[#00245D]/60 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skills Card */}
                <div className="glass-panel p-8 flex flex-col h-full group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <GlassIcon icon={Trophy} size="lg" variant="primary" />
                      <h2 className="text-xl font-bold text-[#00245D]">Your Skills</h2>
                    </div>
                    <span className="bg-[#99D6EA]/20 text-[#00245D] px-4 py-1.5 rounded-full text-sm font-bold border border-[#99D6EA]/30">{skills.length}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {skills.slice(0, 4).map(skill => (
                      <div key={skill.id} className="flex justify-between items-center p-4 bg-white/40 border border-white/40 rounded-xl hover:bg-white/60 transition-colors shadow-sm">
                        <span className="font-bold text-[#00245D] text-sm">{skill.skillName}</span>
                        <span className="text-xs bg-white/80 px-2.5 py-1 rounded-lg text-[#00245D]/70 capitalize font-medium">{skill.willingnessLevel.replace('_', ' ')}</span>
                      </div>
                    ))}
                    {skills.length > 4 && <p className="text-sm text-[#00245D]/70 font-medium text-center italic mt-2">+{skills.length - 4} more skills</p>}
                  </div>
                  <Link href="/profile" className="mt-6 btn-glass flex items-center justify-center gap-2 w-full text-sm uppercase tracking-wider group-hover:bg-[#00245D] group-hover:text-white group-hover:border-[#00245D]">
                    Manage Skills <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Connections Card */}
                <div className="glass-panel p-8 flex flex-col h-full group animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <GlassIcon icon={Handshake} size="lg" variant="secondary" />
                      <h2 className="text-xl font-bold text-[#00245D]">Connections</h2>
                    </div>
                    <span className="bg-[#99D6EA]/20 text-[#00245D] px-4 py-1.5 rounded-full text-sm font-bold border border-[#99D6EA]/30">{connections.length}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {connections.slice(0, 4).map(conn => (
                      <div key={conn.id} className="flex justify-between items-center p-4 bg-white/40 border border-white/40 rounded-xl hover:bg-white/60 transition-colors shadow-sm">
                        <span className="font-bold text-[#00245D] text-sm truncate max-w-[140px]">{conn.organizationName}</span>
                        <span className="text-xs bg-white/80 px-2.5 py-1 rounded-lg text-[#00245D]/70 font-medium">{conn.sector}</span>
                      </div>
                    ))}
                    {connections.length > 4 && <p className="text-sm text-[#00245D]/70 font-medium text-center italic mt-2">+{connections.length - 4} more</p>}
                  </div>
                  <Link href="/profile" className="mt-6 btn-glass flex items-center justify-center gap-2 w-full text-sm uppercase tracking-wider group-hover:bg-[#00245D] group-hover:text-white group-hover:border-[#00245D]">
                    Manage Connections <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Active Needs Card */}
                <div className="glass-panel p-8 flex flex-col h-full group animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <GlassIcon icon={ClipboardList} size="lg" variant="primary" />
                      <h2 className="text-xl font-bold text-[#00245D]">Active Needs</h2>
                    </div>
                    <span className="bg-[#99D6EA]/20 text-[#00245D] px-4 py-1.5 rounded-full text-sm font-bold border border-[#99D6EA]/30">{recentNeeds.length}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {recentNeeds.slice(0, 4).map(need => {
                      const userResponse = userResponses.find(r => r.needId === need.id);
                      return (
                        <Link key={need.id} href={`/needs/${need.id}`} className="block p-4 bg-white/40 border border-white/40 rounded-xl hover:bg-white/60 transition-colors relative group/item shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#00245D] text-sm truncate group-hover/item:text-[#00245D]">{need.title}</p>
                              <p className="text-xs text-[#00245D]/60 mt-0.5 font-medium">{need.category}</p>
                            </div>
                            {userResponse && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider ${userResponse.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                userResponse.status === 'declined' ? 'bg-red-100 text-red-700' :
                                  userResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {userResponse.status === 'accepted' ? 'Accepted' :
                                  userResponse.status === 'declined' ? 'Declined' :
                                    userResponse.status === 'reviewed' ? 'Reviewed' :
                                      'Pending'}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/needs" className="mt-6 btn-glass flex items-center justify-center gap-2 w-full text-sm uppercase tracking-wider group-hover:bg-[#00245D] group-hover:text-white group-hover:border-[#00245D]">
                    View All Needs <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

