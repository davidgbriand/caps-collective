'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection } from '@/types';
import GlassIcon from '@/components/GlassIcon';
import { MapPin, Mail, Phone, Linkedin, Trophy, Handshake, ArrowLeft, Sparkles, Network } from 'lucide-react';

interface UserProfile {
  displayName: string;
  email: string;
  profilePhoto?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  linkedinUrl?: string;
  skills: Skill[];
  connections: Connection[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Fetch skills
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', userId));
        const skillsSnapshot = await getDocs(skillsQuery);
        const skills = skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));

        // Fetch connections
        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', userId));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        const connections = connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection));

        setProfile({
          displayName: userData.displayName || 'Community Member',
          email: userData.email || '',
          profilePhoto: userData.profilePhoto || '',
          bio: userData.bio,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          linkedinUrl: userData.linkedinUrl,
          skills,
          connections
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-[#00245D] text-lg font-bold">{error || 'User not found'}</p>
              <button
                onClick={() => router.back()}
                className="mt-6 px-6 py-3 bg-[#00245D] text-white rounded-xl hover:bg-[#00245D]/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-10 text-[#00245D] hover:text-[#00245D]/70 font-bold flex items-center gap-2 hover:-translate-x-1 transition-transform uppercase tracking-wider text-xs"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            BACK TO SEARCH
          </button>

          {/* User Profile Card */}
          <div className="glass-panel p-8 md:p-10 mb-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-[#00245D] rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-xl overflow-hidden shrink-0 border-4 border-white/20">
                {profile.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profilePhoto} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName[0]
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-[#00245D] tracking-tight mb-2">{profile.displayName}</h1>
                    {profile.location && (
                      <p className="flex items-center gap-2 text-[#00245D]/70 font-medium text-lg">
                        <MapPin className="w-5 h-5" /> {profile.location}
                      </p>
                    )}
                  </div>
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] text-white rounded-xl font-bold hover:bg-[#0077b5]/90 transition-transform hover:-translate-y-0.5 shadow-md"
                    >
                      <Linkedin className="w-5 h-5" />
                      LinkedIn
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Contact Info */}
                  <div className="space-y-3 bg-[#00245D]/5 p-5 rounded-2xl border border-[#00245D]/5">
                    <h3 className="text-sm font-bold text-[#00245D]/50 uppercase tracking-wider">Contact Details</h3>
                    <div className="flex items-center gap-3 text-[#00245D] font-medium">
                      <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[#00245D]"><Mail className="w-4 h-4" /></span>
                      {profile.email}
                    </div>
                    {profile.phoneNumber && (
                      <div className="flex items-center gap-3 text-[#00245D] font-medium">
                        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[#00245D]"><Phone className="w-4 h-4" /></span>
                        {profile.phoneNumber}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-[#00245D]/50 uppercase tracking-wider">About</h3>
                      <p className="text-[#00245D]/80 leading-relaxed text-lg">
                        {profile.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills Section */}
            <div className="glass-panel p-8 animate-fadeIn h-full" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-[#00245D] mb-6 flex items-center gap-3">
                <GlassIcon icon={Trophy} size="md" variant="primary" />
                Skills & Expertise
                <span className="ml-auto text-sm font-bold text-[#00245D] bg-[#99D6EA]/20 px-3 py-1 rounded-full">{profile.skills.length}</span>
              </h2>
              {profile.skills.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00245D]/5 mb-4 text-[#00245D]/40">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="font-medium">No skills listed yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {profile.skills.map((skill, i) => (
                    <div
                      key={skill.id}
                      className="bg-white/40 backdrop-blur-sm rounded-2xl p-5 border border-white/40 hover:bg-white/60 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-[#00245D] text-lg">{skill.skillName}</h3>
                          <p className="text-[#00245D]/70 text-sm font-medium mt-0.5">{skill.category}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-[#00245D] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                            {skill.willingnessLevel.replace('_', ' ')}
                          </span>
                          {skill.isHobby && (
                            <span className="bg-[#99D6EA] text-[#00245D] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              Hobby
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connections Section */}
            <div className="glass-panel p-8 animate-fadeIn h-full" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-[#00245D] mb-6 flex items-center gap-3">
                <GlassIcon icon={Handshake} size="md" variant="secondary" />
                Connections
                <span className="ml-auto text-sm font-bold text-[#00245D] bg-[#99D6EA]/20 px-3 py-1 rounded-full">{profile.connections.length}</span>
              </h2>
              {profile.connections.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00245D]/5 mb-4 text-[#00245D]/40">
                    <Network className="w-8 h-8" />
                  </div>
                  <p className="font-medium">No connections listed yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {profile.connections.map((connection, i) => (
                    <div
                      key={connection.id}
                      className="bg-white/40 backdrop-blur-sm rounded-2xl p-5 border border-white/40 hover:bg-white/60 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-[#00245D] text-lg">{connection.organizationName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[#00245D]/70 text-sm font-medium">{connection.sector}</span>
                            {connection.contactName && (
                              <span className="text-[#00245D]/40 text-xs">• via {connection.contactName}</span>
                            )}
                          </div>
                        </div>
                        <span className="bg-[#99D6EA] text-[#00245D] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                          {connection.relationshipStrength.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


