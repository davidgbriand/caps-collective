'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SKILL_CATEGORIES, SkillCategory, Need } from '@/types';
import { SparklesIcon, XIcon, ChevronDownIcon, MapPinIcon, CalendarIcon, TextIcon, ListChecksIcon, ClipboardListIcon, PlusIcon } from '@/components/Icons';

interface AdminNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    needToEdit?: Need;
}

export default function AdminNeedModal({ isOpen, onClose, onSuccess, needToEdit }: AdminNeedModalProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const getDefaultFormState = () => ({
        title: '',
        category: 'Sports & Coaching' as SkillCategory,
        location: '',
        timeline: '',
        overview: '',
        scopeItems: [''],
        requirements: [''],
        additionalInfo: '',
    });

    const [newNeed, setNewNeed] = useState(getDefaultFormState);

    // Sync form state when needToEdit or isOpen changes
    useEffect(() => {
        if (isOpen && needToEdit) {
            // Parse location and timeline from description if possible
            const desc = needToEdit.description || '';
            const locationMatch = desc.match(/Project Location:\s*(.*?)(?=\s*Timeline:|——|$)/);
            const timelineMatch = desc.match(/Timeline:\s*([^——]*)/);
            const overviewMatch = desc.match(/—— Project Overview\s*([\s\S]*?)(?=——|$)/);

            setNewNeed({
                title: needToEdit.title,
                category: needToEdit.category,
                location: locationMatch ? locationMatch[1].trim() : '',
                timeline: timelineMatch ? timelineMatch[1].trim() : '',
                overview: overviewMatch ? overviewMatch[1].trim() : desc,
                scopeItems: [''],
                requirements: [''],
                additionalInfo: '',
            });
        } else if (isOpen) {
            setNewNeed(getDefaultFormState());
        }
        setSubmitMessage('');
    }, [isOpen, needToEdit]);

    if (!isOpen) return null;

    // Helper to format structured data into description
    const formatNeedDescription = () => {
        const parts: string[] = [];

        // Key details
        if (newNeed.location) parts.push(`Project Location: ${newNeed.location}`);
        if (newNeed.timeline) parts.push(`Timeline: ${newNeed.timeline}`);

        // Overview section
        if (newNeed.overview) {
            parts.push(`—— Project Overview ${newNeed.overview}`);
        }

        // Scope section with items
        const validScopes = newNeed.scopeItems.filter(s => s.trim());
        if (validScopes.length > 0) {
            parts.push(`—— Scope of Work ${validScopes.map((item, i) => `${i + 1}. ${item}`).join(' · ')}`);
        }

        // Requirements section
        const validReqs = newNeed.requirements.filter(r => r.trim());
        if (validReqs.length > 0) {
            parts.push(`—— Requirements ${validReqs.join(' · ')}`);
        }

        // Additional info
        if (newNeed.additionalInfo) {
            parts.push(`—— Additional Information ${newNeed.additionalInfo}`);
        }

        return parts.join(' ');
    };

    const handleCreateNeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newNeed.title) return;

        setSubmitting(true);
        setSubmitMessage('');

        const formattedDescription = formatNeedDescription();

        try {
            const token = await user.getIdToken();
            const url = '/api/needs';
            const method = needToEdit ? 'PATCH' : 'POST';
            const body = needToEdit ? {
                needId: needToEdit.id,
                updates: {
                    title: newNeed.title,
                    description: formattedDescription,
                    category: newNeed.category,
                }
            } : {
                title: newNeed.title,
                description: formattedDescription,
                category: newNeed.category,
                userId: user.uid,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitMessage(`Need ${needToEdit ? 'updated' : 'created'} successfully!`);

                if (!needToEdit) {
                    // Reset form only if creating
                    setNewNeed({
                        title: '',
                        category: 'Sports & Coaching' as SkillCategory,
                        location: '',
                        timeline: '',
                        overview: '',
                        scopeItems: [''],
                        requirements: [''],
                        additionalInfo: '',
                    });
                }

                // Notify parent and close after a brief delay
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setSubmitMessage('');
                }, 1500);

            } else {
                setSubmitMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setSubmitMessage(`Failed to ${needToEdit ? 'update' : 'create'} need`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-[#00245D]/20 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="glass-panel w-full max-w-4xl my-auto overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/40" style={{ maxHeight: 'min(95vh, 900px)' }}>

                {/* Hero Header - Navy Gradient (Matches User Profile) */}
                <div className="relative shrink-0 bg-gradient-to-r from-[#00245D] via-[#003380] to-[#00245D] px-6 py-5 text-white overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#99D6EA] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 tracking-tight text-white">
                                <SparklesIcon className="text-[#99D6EA]" size={24} />
                                {needToEdit ? 'Edit Need' : 'Create New Need'}
                            </h2>
                            <p className="text-white/70 text-sm mt-1 font-medium">
                                {needToEdit ? 'Update project details and requirements' : 'Define a new community project or requirement'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                        >
                            <XIcon size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#f0f4f8]/50 to-white/20">
                    <form onSubmit={handleCreateNeed} className="space-y-6">

                        {/* Project Overview Card (Glass Card) */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-white/30 bg-white/30 flex items-center gap-2">
                                <span className="p-1.5 bg-[#00245D]/5 rounded-lg text-[#00245D]"><TextIcon size={16} /></span>
                                <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider">Project Overview</h3>
                            </div>
                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title Input */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[#00245D]/70 uppercase tracking-wider ml-1">Need Title <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={newNeed.title}
                                        onChange={(e) => setNewNeed({ ...newNeed, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#00245D]/10 focus:border-[#00245D]/20 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                        placeholder="e.g., Website Redesign Project"
                                        required
                                    />
                                </div>

                                {/* Category Dropdown */}
                                <div className="space-y-1.5 relative z-30">
                                    <label className="block text-xs font-bold text-[#00245D]/70 uppercase tracking-wider ml-1">Category <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className={`w-full text-left px-4 py-2.5 bg-white/60 border border-white/50 hover:bg-white/80 transition-all rounded-lg text-[#00245D] flex items-center justify-between group ${isCategoryOpen ? 'ring-2 ring-[#00245D]/10 bg-white' : ''}`}
                                        >
                                            <span className="font-medium text-sm">{newNeed.category}</span>
                                            <ChevronDownIcon
                                                size={16}
                                                className={`text-[#00245D]/50 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {isCategoryOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)} />
                                                <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white border border-[#00245D]/10 shadow-xl rounded-xl max-h-60 overflow-y-auto z-20 animate-in fade-in zoom-in-95 duration-200">
                                                    {SKILL_CATEGORIES.map((cat) => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewNeed({ ...newNeed, category: cat });
                                                                setIsCategoryOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                                                ${newNeed.category === cat
                                                                    ? 'bg-[#00245D] text-white shadow-sm'
                                                                    : 'text-[#00245D]/70 hover:bg-[#00245D]/5 hover:text-[#00245D]'
                                                                }`}
                                                        >
                                                            {newNeed.category === cat && <SparklesIcon size={14} />}
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Description - Full Width */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-xs font-bold text-[#00245D]/70 uppercase tracking-wider ml-1">Description <span className="text-red-400">*</span></label>
                                    <textarea
                                        value={newNeed.overview}
                                        onChange={(e) => setNewNeed({ ...newNeed, overview: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#00245D]/10 focus:border-[#00245D]/20 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30 min-h-[100px] resize-y"
                                        rows={3}
                                        placeholder="Describe the project goals and impact..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logistics Card */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-white/30 bg-white/30 flex items-center gap-2">
                                <span className="p-1.5 bg-[#00245D]/5 rounded-lg text-[#00245D]"><MapPinIcon size={16} /></span>
                                <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider">Key Logistics</h3>
                            </div>
                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#00245D]/70 mb-1.5 uppercase tracking-wider ml-1">Location</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00245D]/40">
                                            <MapPinIcon size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newNeed.location}
                                            onChange={(e) => setNewNeed({ ...newNeed, location: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#00245D]/10 focus:border-[#00245D]/20 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                            placeholder="e.g., Remote / London, ON"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#00245D]/70 mb-1.5 uppercase tracking-wider ml-1">Expected Timeline</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00245D]/40">
                                            <CalendarIcon size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newNeed.timeline}
                                            onChange={(e) => setNewNeed({ ...newNeed, timeline: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#00245D]/10 focus:border-[#00245D]/20 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                            placeholder="e.g., Q1 2026 (Flexible)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scope of Work Card */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-white/30 bg-white/30 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-[#00245D]/5 rounded-lg text-[#00245D]"><ListChecksIcon size={16} /></span>
                                    <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider">Scope of Work</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewNeed({ ...newNeed, scopeItems: [...newNeed.scopeItems, ''] })}
                                    className="text-xs px-3 py-1 bg-white hover:bg-[#00245D]/5 text-[#00245D] rounded-full font-bold border border-[#00245D]/10 shadow-sm transition-all flex items-center gap-1"
                                >
                                    <PlusIcon size={12} strokeWidth={3} /> Add Item
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {newNeed.scopeItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-[#00245D] text-xs font-bold bg-white/60 rounded-full border border-white/40 shadow-sm">{index + 1}</span>
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const updated = [...newNeed.scopeItems];
                                                    updated[index] = e.target.value;
                                                    setNewNeed({ ...newNeed, scopeItems: updated });
                                                }}
                                                className="w-full px-4 py-2 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:shadow-sm focus:ring-0 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                                placeholder="Define a specific deliverable..."
                                            />
                                            {newNeed.scopeItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = newNeed.scopeItems.filter((_, i) => i !== index);
                                                        setNewNeed({ ...newNeed, scopeItems: updated });
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00245D]/30 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <XIcon size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Requirements Card */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-white/30 bg-white/30 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-[#00245D]/5 rounded-lg text-[#00245D]"><ClipboardListIcon size={16} /></span>
                                    <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider">Requisites</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewNeed({ ...newNeed, requirements: [...newNeed.requirements, ''] })}
                                    className="text-xs px-3 py-1 bg-white hover:bg-[#00245D]/5 text-[#00245D] rounded-full font-bold border border-[#00245D]/10 shadow-sm transition-all flex items-center gap-1"
                                >
                                    <PlusIcon size={12} strokeWidth={3} /> Add Req
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {newNeed.requirements.map((item, index) => (
                                    <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-[#00245D]/40 mt-0.5">•</span>
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const updated = [...newNeed.requirements];
                                                    updated[index] = e.target.value;
                                                    setNewNeed({ ...newNeed, requirements: updated });
                                                }}
                                                className="w-full px-4 py-2 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:shadow-sm focus:ring-0 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                                placeholder="Required skill or certification..."
                                            />
                                            {newNeed.requirements.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = newNeed.requirements.filter((_, i) => i !== index);
                                                        setNewNeed({ ...newNeed, requirements: updated });
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00245D]/30 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <XIcon size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Info Card */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <div className="p-4 sm:p-6">
                                <label className="block text-xs font-bold text-[#00245D]/70 mb-1.5 uppercase tracking-wider ml-1">Additional Information</label>
                                <textarea
                                    value={newNeed.additionalInfo}
                                    onChange={(e) => setNewNeed({ ...newNeed, additionalInfo: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/60 border border-white/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#00245D]/10 focus:border-[#00245D]/20 transition-all text-sm font-medium text-[#00245D] placeholder-[#00245D]/30"
                                    rows={2}
                                    placeholder="Any other details, notes, or context..."
                                />
                            </div>
                        </div>

                        {/* Message & Actions */}
                        {submitMessage && (
                            <div className={`text-sm p-4 sm:p-6 rounded-xl border ${submitMessage.includes('Error')
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-green-50 text-green-600 border-green-100'
                                } animate-fadeIn`}>
                                {submitMessage}
                            </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row gap-4 pb-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 btn-primary text-base py-3 shadow-lg hover:shadow-xl"
                            >
                                {submitting ? (needToEdit ? 'Updating...' : 'Creating...') : (needToEdit ? '✨ Save Changes' : '✨ Create Need')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-3 bg-white border border-[#D4C4A8]/50 text-[#00245D] rounded-full font-bold hover:bg-[#f8fafc] transition-all hover:shadow-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
