'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection } from '@/types';
import AvatarUploader from '@/components/AvatarUploader';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [location, setLocation] = useState(userData?.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(userData?.linkedinUrl || '');
  const [profilePhoto, setProfilePhoto] = useState(userData?.profilePhoto || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', user.uid));
        const skillsSnapshot = await getDocs(skillsQuery);
        setSkills(skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));

        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        setConnections(connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection)));
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    if (userData) {
      if (userData.displayName) setDisplayName(userData.displayName);
      if (userData.phoneNumber) setPhoneNumber(userData.phoneNumber);
      if (userData.bio) setBio(userData.bio);
      if (userData.location) setLocation(userData.location);
      if (userData.linkedinUrl) setLinkedinUrl(userData.linkedinUrl);
      if (userData.profilePhoto) setProfilePhoto(userData.profilePhoto);
    }
  }, [user, userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    if (!phoneNumber.trim()) {
      setMessage('Phone number is required and cannot be removed');
      setSaving(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phoneNumber,
        bio,
        location,
        linkedinUrl,
        profilePhoto,
        updatedAt: serverTimestamp(),
      });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👤</span>
              Your Profile
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="glass-panel p-8 animate-fadeIn">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-[#00245D] rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-[#00245D]/20 overflow-hidden ring-4 ring-white/30">
                    {profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profilePhoto} alt={displayName || 'Profile'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-[#00245D] mb-1">{displayName || 'Community Member'}</h2>
                    <p className="text-[#00245D]/60 font-medium text-lg">{user?.email}</p>
                    <div className="flex gap-3 mt-4">
                      <span className="bg-[#99D6EA]/20 text-[#00245D] px-4 py-1.5 rounded-full text-sm font-bold border border-[#99D6EA]/30 shadow-sm">{skills.length} Skills</span>
                      <span className="bg-[#99D6EA]/20 text-[#00245D] px-4 py-1.5 rounded-full text-sm font-bold border border-[#99D6EA]/30 shadow-sm">{connections.length} Connections</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6 pt-8 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">Email</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 border border-[#00245D]/10 rounded-xl bg-[#00245D]/5 text-[#00245D]/60 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">Display Name</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 border-0 rounded-xl bg-white/50 focus:ring-2 focus:ring-[#99D6EA]/50 text-[#00245D] font-bold placeholder-[#00245D]/30 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 border-0 rounded-xl bg-white/50 focus:ring-2 focus:ring-[#99D6EA]/50 text-[#00245D] font-bold placeholder-[#00245D]/30 transition-all shadow-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">Location / City</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 border-0 rounded-xl bg-white/50 focus:ring-2 focus:ring-[#99D6EA]/50 text-[#00245D] font-bold placeholder-[#00245D]/30 transition-all shadow-sm"
                        placeholder="e.g. Vancouver, BC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-4 py-3 border-0 rounded-xl bg-white/50 focus:ring-2 focus:ring-[#99D6EA]/50 text-[#00245D] font-bold placeholder-[#00245D]/30 transition-all shadow-sm"
                        placeholder="https://www.linkedin.com/in/username"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <AvatarUploader
                        currentPhotoUrl={profilePhoto}
                        onPhotoUploaded={setProfilePhoto}
                        userId={user?.uid}
                        displayName={displayName}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#00245D] mb-2 uppercase tracking-wide">Brief Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-3 border-0 rounded-xl bg-white/50 focus:ring-2 focus:ring-[#99D6EA]/50 text-[#00245D] font-medium placeholder-[#00245D]/30 transition-all shadow-sm resize-none"
                      rows={3}
                      placeholder="Tell the community a bit about yourself, your role, or how you like to help."
                    />
                  </div>
                  {message && <p className={`text-sm px-4 py-3 rounded-xl font-bold flex items-center gap-2 ${message.includes('success') ? 'bg-green-100/50 text-green-800' : 'bg-red-100/50 text-red-800'}`}>{message.includes('success') ? '✓' : '⚠️'} {message}</p>}
                  <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto min-w-[160px] justify-center text-lg">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Skills Card */}
              <div className="glass-panel p-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#00245D] flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#00245D] rounded-lg flex items-center justify-center text-white text-sm shadow-md">⚽</span>
                    Your Skills
                    <span className="text-xs font-bold text-[#00245D]/60 bg-[#00245D]/5 px-2.5 py-1 rounded-full border border-[#00245D]/5">{skills.length}</span>
                  </h2>
                  <Link href="/profile/skills" className="btn-glass px-4 py-2 text-xs h-auto bg-white/40">Edit</Link>
                </div>
                <div className="flex flex-wrap gap-3">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-xl border border-white/40 shadow-sm hover:bg-white/60 transition-colors">
                      <span className="font-bold text-[#00245D]">{skill.skillName}</span>
                      <span className="w-1 h-4 bg-[#00245D]/10 rounded-full"></span>
                      <span className="text-xs font-semibold text-[#00245D]/60 uppercase tracking-wide">{skill.willingnessLevel.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {skills.length === 0 && <p className="text-[#00245D]/40 font-medium italic p-2">No skills added yet</p>}
                </div>
              </div>

              {/* Connections Card */}
              <div className="glass-panel p-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#00245D] flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#00245D] rounded-lg flex items-center justify-center text-white text-sm shadow-md">🤝</span>
                    Your Connections
                    <span className="text-xs font-bold text-[#00245D]/60 bg-[#00245D]/5 px-2.5 py-1 rounded-full border border-[#00245D]/5">{connections.length}</span>
                  </h2>
                  <Link href="/profile/connections" className="btn-glass px-4 py-2 text-xs h-auto bg-white/40">Edit</Link>
                </div>
                <div className="flex flex-wrap gap-3">
                  {connections.map(conn => (
                    <div key={conn.id} className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-xl border border-white/40 shadow-sm hover:bg-white/60 transition-colors">
                      <span className="font-bold text-[#00245D]">{conn.organizationName}</span>
                      <span className="w-1 h-4 bg-[#00245D]/10 rounded-full"></span>
                      <span className="text-xs font-semibold text-[#00245D]/60 uppercase tracking-wide">{conn.sector}</span>
                    </div>
                  ))}
                  {connections.length === 0 && <p className="text-[#00245D]/40 font-medium italic p-2">No connections added yet</p>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}


