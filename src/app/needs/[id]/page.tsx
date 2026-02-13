'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StrengthMeter from '@/components/StrengthMeter';
import FormattedDescription from '@/components/FormattedDescription';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Need, CapsScoreResult, NeedResponse, SKILL_CATEGORIES } from '@/types';
import GlassIcon from '@/components/GlassIcon';
import {
  Pencil as LuPencil,
  Trash2 as LuTrash2,
  Archive as LuArchive,
  RotateCcw as LuRotateCcw,
  Save as LuSave,
  X as LuX,
  FileText as LuFileText,
  Trophy as LuTrophy,
  Search as LuSearch,
  ChevronLeft as LuChevronLeft,
  MapPin as LuMapPin,
  Calendar as LuCalendar,
  ListChecks as LuListChecks,
  ClipboardList as LuClipboardList,
  Plus as LuPlus,
  Check as LuCheck
} from 'lucide-react';

export default function NeedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<CapsScoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTimeline, setEditTimeline] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [editScopeItems, setEditScopeItems] = useState<string[]>(['']);
  const [editRequirements, setEditRequirements] = useState<string[]>(['']);
  const [editAdditionalInfo, setEditAdditionalInfo] = useState('');

  // Response form state
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [existingResponse, setExistingResponse] = useState<NeedResponse | null>(null);
  const [responseSuccess, setResponseSuccess] = useState(false);

  useEffect(() => {
    async function fetchNeedAndData() {
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

        const token = await user.getIdToken();

        // Fetch matches with authentication token (admin only)
        if (isAdmin) {
          const matchResponse = await fetch(`/api/caps-score?category=${needData.category}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const matchData = await matchResponse.json();

          if (matchData.success) {
            setMatches(matchData.data);
          }
        }

        // Check if user already responded to this need
        const responseCheck = await fetch(`/api/need-responses?needId=${params.id}&userOnly=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const responseData = await responseCheck.json();

        if (responseData.success && responseData.data.responses.length > 0) {
          const newResponse = responseData.data.responses[0];

          // Check if status changed and show notification
          if (existingResponse && existingResponse.status !== newResponse.status) {
            // Status changed! Could show a toast here
            console.log('Response status updated:', newResponse.status);
          }

          setExistingResponse(newResponse);
        }
      } catch (error) {
        console.error('Error fetching need:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNeedAndData();

    // Poll for updates every 30 seconds if user has submitted a response
    const pollInterval = setInterval(() => {
      if (existingResponse && !isAdmin) {
        fetchNeedAndData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [params.id, router, user, isAdmin, existingResponse]);

  const handleToggleStatus = async () => {
    if (!need || !isAdmin) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'needs', need.id), {
        isActive: !need.isActive,
        updatedAt: new Date(),
      });
      setNeed({ ...need, isActive: !need.isActive });
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!need || !isAdmin) return;
    if (!confirm('Are you sure you want to delete this need? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'needs', need.id));
      router.push('/needs');
    } catch (error) {
      console.error('Error deleting need:', error);
      setActionLoading(false);
    }
  };

  // Parse description string back into structured fields
  const parseDescription = (desc: string) => {
    const sections = desc.split(/\s*——\s*/);
    let location = '';
    let timeline = '';
    let overview = '';
    let scopeItems: string[] = [''];
    let requirements: string[] = [''];
    let additionalInfo = '';

    // First section has key details (Location, Timeline)
    if (sections[0]) {
      const locMatch = sections[0].match(/Project Location:\s*(.+?)(?=\s+Timeline:|$)/);
      if (locMatch) location = locMatch[1].trim();
      const timeMatch = sections[0].match(/Timeline:\s*(.+?)$/);
      if (timeMatch) timeline = timeMatch[1].trim();
    }

    // Remaining sections
    for (let i = 1; i < sections.length; i++) {
      const sec = sections[i].trim();
      if (sec.startsWith('Project Overview')) {
        overview = sec.replace(/^Project Overview\s*/, '').trim();
      } else if (sec.startsWith('Scope of Work')) {
        const items = sec.replace(/^Scope of Work\s*/, '').split(/\s*·\s*/).map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(s => s);
        scopeItems = items.length > 0 ? items : [''];
      } else if (sec.startsWith('Requirements')) {
        const items = sec.replace(/^Requirements\s*/, '').split(/\s*·\s*/).map(s => s.trim()).filter(s => s);
        requirements = items.length > 0 ? items : [''];
      } else if (sec.startsWith('Additional Information')) {
        additionalInfo = sec.replace(/^Additional Information\s*/, '').trim();
      }
    }

    return { location, timeline, overview, scopeItems, requirements, additionalInfo };
  };

  // Re-serialize structured fields back into description string
  const formatDescription = () => {
    const parts: string[] = [];
    if (editLocation) parts.push(`Project Location: ${editLocation}`);
    if (editTimeline) parts.push(`Timeline: ${editTimeline}`);
    if (editOverview) parts.push(`—— Project Overview ${editOverview}`);
    const validScopes = editScopeItems.filter(s => s.trim());
    if (validScopes.length > 0) {
      parts.push(`—— Scope of Work ${validScopes.map((item, i) => `${i + 1}. ${item}`).join(' · ')}`);
    }
    const validReqs = editRequirements.filter(r => r.trim());
    if (validReqs.length > 0) {
      parts.push(`—— Requirements ${validReqs.join(' · ')}`);
    }
    if (editAdditionalInfo) {
      parts.push(`—— Additional Information ${editAdditionalInfo}`);
    }
    return parts.join(' ');
  };

  const handleStartEdit = () => {
    if (!need) return;
    setEditTitle(need.title);
    setEditCategory(need.category);
    const parsed = parseDescription(need.description);
    setEditLocation(parsed.location);
    setEditTimeline(parsed.timeline);
    setEditOverview(parsed.overview);
    setEditScopeItems(parsed.scopeItems);
    setEditRequirements(parsed.requirements);
    setEditAdditionalInfo(parsed.additionalInfo);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!need || !isAdmin || !editTitle.trim()) return;
    setActionLoading(true);
    try {
      const newDescription = formatDescription();
      await updateDoc(doc(db, 'needs', need.id), {
        title: editTitle.trim(),
        description: newDescription,
        category: editCategory,
        updatedAt: new Date(),
      });
      setNeed({
        ...need,
        title: editTitle.trim(),
        description: newDescription,
        category: editCategory as any,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating need:', error);
      alert('Failed to update need');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !need || !responseMessage.trim()) return;

    setSubmittingResponse(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/need-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId: need.id,
          message: responseMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExistingResponse(data.data);
        setResponseSuccess(true);
        setShowResponseForm(false);
        setResponseMessage('');
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Check if description is long enough to need collapsing
  const isLongDescription = need?.description && need.description.length > 500;

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
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          {/* Back Button */}
          <button onClick={() => router.back()} className="mb-10 text-[#00245D] hover:text-[#00245D]/70 font-bold flex items-center gap-2 hover:-translate-x-1 transition-transform uppercase tracking-wider text-xs">
            <LuChevronLeft size={16} strokeWidth={3} /> BACK TO NEEDS BOARD
          </button>

          {/* Main Card */}
          <div className="glass-panel animate-fadeIn overflow-hidden">
            {/* Header Section */}
            <div className="p-8 border-b border-[#D4C4A8]/50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    {isEditing ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-sm text-[#00245D] font-semibold bg-[#99D6EA]/30 px-4 py-1.5 rounded-full border border-[#99D6EA] focus:ring-2 focus:ring-[#00245D] focus:outline-none"
                      >
                        {SKILL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-[#00245D] font-semibold bg-[#99D6EA]/30 px-4 py-1.5 rounded-full">
                        {need.category}
                      </span>
                    )}
                    {need.isActive ? (
                      <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold">
                        Closed
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold text-[#00245D] leading-tight w-full border-2 border-[#D4C4A8] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D] focus:outline-none"
                      placeholder="Need title"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-[#00245D] leading-tight">{need.title}</h1>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                <GlassIcon icon={LuFileText} size="sm" />
                Project Details
              </h3>

              {isEditing ? (
                <div className="space-y-5">
                  {/* Key Details (Etched Glass Look) */}
                  <div className="glass-panel !bg-[#00245D]/5 p-6 border border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                    <h4 className="text-sm font-bold text-[#00245D] mb-5 flex items-center gap-2 uppercase tracking-wider opacity-80">
                      <span className="p-1.5 bg-[#00245D]/10 rounded-lg"><LuMapPin size={14} /></span>
                      Key Logistics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-[#00245D]/60 mb-2 uppercase tracking-wider ml-1">Location</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00245D]/40">
                            <LuMapPin size={16} />
                          </div>
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/40 border border-white/30 rounded-lg focus:bg-white/60 focus:ring-2 focus:ring-[#00245D]/10 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                            placeholder="e.g., Vancouver, BC or Remote"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#00245D]/60 mb-2 uppercase tracking-wider ml-1">Timeline</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00245D]/40">
                            <LuCalendar size={16} />
                          </div>
                          <input
                            type="text"
                            value={editTimeline}
                            onChange={(e) => setEditTimeline(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/40 border border-white/30 rounded-lg focus:bg-white/60 focus:ring-2 focus:ring-[#00245D]/10 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                            placeholder="e.g., ASAP, March 2025, Flexible"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Overview */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#00245D] tracking-wide ml-1 flex items-center gap-2">
                      <LuFileText size={16} className="text-[#00245D]/60" />
                      Project Overview
                    </label>
                    <textarea
                      value={editOverview}
                      onChange={(e) => setEditOverview(e.target.value)}
                      className="w-full px-4 py-3.5 glass-panel !bg-white/30 border border-white/40 shadow-inner focus:ring-4 focus:ring-[#00245D]/5 focus:border-white/60 focus:!bg-white/50 transition-all rounded-xl text-[#00245D] placeholder-[#00245D]/30 text-base min-h-[120px]"
                      rows={3}
                      placeholder="Describe the project goals and impact..."
                    />
                  </div>

                  {/* Scope of Work */}
                  <div className="bg-gradient-to-b from-[#99D6EA]/10 to-transparent p-6 rounded-2xl border border-white/30">
                    <h4 className="text-sm font-bold text-[#00245D] mb-5 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="p-1.5 bg-[#00245D] rounded-lg text-white shadow-md"><LuListChecks size={14} strokeWidth={2} /></span>
                        Scope of Work
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditScopeItems([...editScopeItems, ''])}
                        className="text-xs px-4 py-1.5 bg-white/60 hover:bg-white text-[#00245D] rounded-full font-bold border border-white/40 shadow-sm transition-all flex items-center gap-1"
                      >
                        <LuPlus size={12} strokeWidth={3} /> Add Item
                      </button>
                    </h4>
                    <div className="space-y-3 pl-1">
                      {editScopeItems.map((item, index) => (
                        <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-[#00245D] text-xs font-bold bg-white/50 rounded-full border border-white/40 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">{index + 1}</span>
                          <div className="flex-1 relative group">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const updated = [...editScopeItems];
                                updated[index] = e.target.value;
                                setEditScopeItems(updated);
                              }}
                              className="w-full px-4 py-2 bg-white/40 border border-white/30 rounded-lg focus:bg-white/80 focus:shadow-md focus:ring-0 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                              placeholder="Define a specific deliverable..."
                            />
                            {editScopeItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setEditScopeItems(editScopeItems.filter((_, i) => i !== index))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00245D]/30 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              >
                                <LuX size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="bg-[#D4C4A8]/10 p-6 rounded-2xl border border-[#D4C4A8]/20">
                    <h4 className="text-sm font-bold text-[#00245D] mb-5 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="p-1.5 bg-[#D4C4A8]/40 rounded-lg text-[#00245D] border border-[#D4C4A8]/30"><LuClipboardList size={14} strokeWidth={2} /></span>
                        Requisites
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditRequirements([...editRequirements, ''])}
                        className="text-xs px-4 py-1.5 bg-white/60 hover:bg-white text-[#00245D] rounded-full font-bold border border-white/40 shadow-sm transition-all flex items-center gap-1"
                      >
                        <LuPlus size={12} strokeWidth={3} /> Add Req
                      </button>
                    </h4>
                    <div className="space-y-3 pl-1">
                      {editRequirements.map((item, index) => (
                        <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-[#00245D]/40 mt-0.5">•</span>
                          <div className="flex-1 relative group">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const updated = [...editRequirements];
                                updated[index] = e.target.value;
                                setEditRequirements(updated);
                              }}
                              className="w-full px-4 py-2 bg-white/40 border border-white/30 rounded-lg focus:bg-white/80 focus:shadow-md focus:ring-0 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                              placeholder="Required skill or certification..."
                            />
                            {editRequirements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setEditRequirements(editRequirements.filter((_, i) => i !== index))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00245D]/30 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              >
                                <LuX size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label className="block text-sm font-medium text-[#00245D] mb-1">Additional Information</label>
                    <textarea
                      value={editAdditionalInfo}
                      onChange={(e) => setEditAdditionalInfo(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                      rows={2}
                      placeholder="Any other details, notes, or context..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className={`relative ${isLongDescription && !isExpanded ? 'max-h-80 overflow-hidden' : ''}`}>
                    <FormattedDescription
                      text={need.description}
                      className="text-[#00245D]/80"
                    />

                    {/* Gradient overlay for collapsed state */}
                    {isLongDescription && !isExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  {isLongDescription && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-4 text-[#00245D] font-semibold flex items-center gap-2 hover:text-[#99D6EA] transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Show Less
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Read Full Description
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* User Response Section - Only for non-admins and active needs */}
            {!isAdmin && need.isActive && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-gradient-to-r from-[#99D6EA]/10 to-transparent">
                {existingResponse || responseSuccess ? (
                  <div className={`border rounded-xl p-5 ${existingResponse?.status === 'accepted' ? 'bg-green-50 border-green-200' :
                    existingResponse?.status === 'declined' ? 'bg-red-50 border-red-200' :
                      existingResponse?.status === 'reviewed' ? 'bg-blue-50 border-blue-200' :
                        'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${existingResponse?.status === 'accepted' ? 'bg-green-100' :
                          existingResponse?.status === 'declined' ? 'bg-red-100' :
                            existingResponse?.status === 'reviewed' ? 'bg-blue-100' :
                              'bg-green-100'
                          }`}>
                          {existingResponse?.status === 'accepted' ? '🎉' :
                            existingResponse?.status === 'declined' ? '📋' :
                              existingResponse?.status === 'reviewed' ? '👀' :
                                '✅'}
                        </span>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${existingResponse?.status === 'accepted' ? 'text-green-800' :
                            existingResponse?.status === 'declined' ? 'text-red-800' :
                              existingResponse?.status === 'reviewed' ? 'text-blue-800' :
                                'text-green-800'
                            }`}>
                            {existingResponse?.status === 'accepted' ? 'Response Accepted!' :
                              existingResponse?.status === 'declined' ? 'Response Reviewed' :
                                existingResponse?.status === 'reviewed' ? 'Response Under Review' :
                                  'Response Submitted!'}
                          </h4>
                          <p className={`text-sm ${existingResponse?.status === 'accepted' ? 'text-green-600' :
                            existingResponse?.status === 'declined' ? 'text-red-600' :
                              existingResponse?.status === 'reviewed' ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                            {existingResponse?.status === 'accepted'
                              ? 'Great news! An admin will contact you soon about this opportunity.'
                              : existingResponse?.status === 'declined'
                                ? 'Thank you for your interest. The admin has reviewed your response.'
                                : existingResponse?.status === 'reviewed'
                                  ? 'Your response is being reviewed by the admin team.'
                                  : 'Your interest has been sent to the admin. They will review and contact you if there\'s a match.'}
                          </p>
                        </div>
                      </div>
                      {existingResponse && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${existingResponse.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          existingResponse.status === 'declined' ? 'bg-red-100 text-red-700' :
                            existingResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {existingResponse.status === 'accepted' ? 'Accepted' :
                            existingResponse.status === 'declined' ? 'Declined' :
                              existingResponse.status === 'reviewed' ? 'Reviewed' :
                                'Pending'}
                        </span>
                      )}
                    </div>
                    {existingResponse && (
                      <div className="mt-3 pl-13">
                        <p className={`text-sm rounded-lg p-3 italic ${existingResponse.status === 'accepted' ? 'text-green-700 bg-green-100' :
                          existingResponse.status === 'declined' ? 'text-red-700 bg-red-100' :
                            existingResponse.status === 'reviewed' ? 'text-blue-700 bg-blue-100' :
                              'text-green-700 bg-green-100'
                          }`}>
                          &quot;{existingResponse.message}&quot;
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className={`text-xs ${existingResponse.status === 'accepted' ? 'text-green-600' :
                            existingResponse.status === 'declined' ? 'text-red-600' :
                              existingResponse.status === 'reviewed' ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                            Submitted: {new Date(existingResponse.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${existingResponse.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                              existingResponse.status === 'declined' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                existingResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                  'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                          >
                            🔄 Refresh Status
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : showResponseForm ? (
                  <form onSubmit={handleSubmitResponse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-2">
                        Your Message to Admin
                      </label>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-[#D4C4A8] rounded-xl focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D] resize-none"
                        rows={4}
                        placeholder="Explain why you're interested and how your skills can help with this need..."
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submittingResponse || !responseMessage.trim()}
                        className="flex-1 py-3 bg-[#00245D] text-white rounded-xl font-semibold hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors"
                      >
                        {submittingResponse ? 'Submitting...' : '📨 Send Response'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowResponseForm(false); setResponseMessage(''); }}
                        className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowResponseForm(true)}
                    className="w-full py-4 bg-[#00245D] text-white rounded-xl font-semibold hover:bg-[#00245D]/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <span className="text-xl">🙋</span>
                    Express Interest in This Need
                  </button>
                )}
              </div>
            )}

            {/* Closed Need Message */}
            {!isAdmin && !need.isActive && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-gray-50">
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-2xl">🔒</span>
                  <p>This need is no longer accepting responses.</p>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-[#D4C4A8]/10">
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={actionLoading || !editTitle.trim()}
                        className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? 'Saving...' : <><LuSave size={18} /> Save Changes</>}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-white text-[#00245D] border border-[#D4C4A8] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <LuX size={18} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        disabled={actionLoading}
                        className="group flex-1 min-w-[140px] px-6 py-3 bg-white/50 hover:bg-white text-[#00245D] border border-[#00245D]/10 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-h-[52px]"
                      >
                        <GlassIcon icon={LuPencil} size="sm" variant="primary" /> Edit Need
                      </button>
                      <button
                        onClick={handleToggleStatus}
                        disabled={actionLoading}
                        className={`group flex-1 min-w-[140px] px-6 py-3 bg-white/50 hover:bg-white text-[#00245D] border border-[#00245D]/10 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-h-[52px] ${need.isActive
                          ? 'text-amber-700'
                          : 'text-green-700'
                          }`}
                      >
                        {need.isActive ? (
                          <><GlassIcon icon={LuArchive} size="sm" variant="warning" /> Close Need</>
                        ) : (
                          <><GlassIcon icon={LuRotateCcw} size="sm" variant="success" /> Reopen Need</>
                        )}
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="group flex-1 min-w-[140px] px-6 py-3 bg-white/50 hover:bg-white text-[#00245D] border border-[#00245D]/10 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-h-[52px]"
                      >
                        <GlassIcon icon={LuTrash2} size="sm" variant="danger" /> Delete Need
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Top Matches - Only visible to admins */}
          {isAdmin && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">
                <GlassIcon icon={LuTrophy} size="sm" variant="secondary" /> Top Matches
                <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">
                  {matches.length} found
                </span>
              </h2>

              {matches.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                  <div className="flex justify-center mb-4"><GlassIcon icon={LuSearch} size="lg" variant="secondary" /></div>
                  <p className="text-[#00245D]/60 text-lg">No matches found for this need yet. Users need to add skills in this category to appear as matches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match, index) => (
                    <div
                      key={match.userId}
                      onClick={() => router.push(`/users/${match.userId}`)}
                      className="glass-panel p-5 hover:bg-white/40 transition-all hover:-translate-y-1 flex items-center justify-between animate-fadeIn cursor-pointer"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' : 'bg-[#00245D]'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#00245D] text-lg">{match.userName || 'Community Member'}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-[#00245D]/60">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#00245D] rounded-full"></span>
                              {match.matchDetails.directSkillMatches} skills
                            </span>
                            {match.matchDetails.hobbySkillMatches > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#99D6EA] rounded-full"></span>
                                {match.matchDetails.hobbySkillMatches} hobbies
                              </span>
                            )}
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
