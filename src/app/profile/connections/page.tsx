'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { CONNECTION_SECTORS, ConnectionSector, RelationshipStrength } from '@/types';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ConnectionEntry {
    id?: string;
    sector: ConnectionSector;
    organizationName: string;
    contactName: string;
    relationshipStrength: RelationshipStrength;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipStrength; label: string; description: string }[] = [
    { value: 'decision_maker', label: 'Decision Maker', description: 'Can make things happen directly' },
    { value: 'strong_contact', label: 'Strong Contact', description: 'Solid relationship, good influence' },
    { value: 'acquaintance', label: 'Acquaintance', description: 'Know them, can make an introduction' },
];

export default function ConnectionsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [connections, setConnections] = useState<ConnectionEntry[]>([
        { sector: 'Corporate', organizationName: '', contactName: '', relationshipStrength: 'strong_contact' }
    ]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch existing connections
    useEffect(() => {
        if (user) {
            const fetchConnections = async () => {
                try {
                    const q = query(collection(db, 'connections'), where('userId', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const fetchedConnections = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        sector: doc.data().sector as ConnectionSector,
                        organizationName: doc.data().organizationName,
                        contactName: doc.data().contactName || '',
                        relationshipStrength: doc.data().relationshipStrength as RelationshipStrength
                    }));

                    if (fetchedConnections.length > 0) {
                        setConnections(fetchedConnections);
                    }
                } catch (err) {
                    console.error("Error fetching connections:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchConnections();
        }
    }, [user]);

    const addConnectionEntry = () => {
        setConnections([...connections, {
            sector: 'Corporate',
            organizationName: '',
            contactName: '',
            relationshipStrength: 'strong_contact'
        }]);
    };

    const removeConnectionEntry = (index: number) => {
        const connToRemove = connections[index];
        if (connToRemove.id) {
            setDeletedIds([...deletedIds, connToRemove.id]);
        }

        if (connections.length > 1) {
            setConnections(connections.filter((_, i) => i !== index));
        } else if (connections.length === 1 && connToRemove.id) {
            // Clear if last one
            setConnections([{ sector: 'Corporate', organizationName: '', contactName: '', relationshipStrength: 'strong_contact' }]);
        }
    };

    const updateConnectionEntry = (index: number, field: keyof ConnectionEntry, value: string) => {
        const newConnections = [...connections];
        newConnections[index] = { ...newConnections[index], [field]: value };
        setConnections(newConnections);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const validConnections = connections.filter(c => c.organizationName);

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const connectionsCollection = collection(db, 'connections');

            // 1. Delete removed connections
            for (const id of deletedIds) {
                await deleteDoc(doc(db, 'connections', id));
            }

            // 2. Add or Update connections
            for (const conn of validConnections) {
                if (conn.id) {
                    // Update existing
                    await updateDoc(doc(db, 'connections', conn.id), {
                        sector: conn.sector,
                        organizationName: conn.organizationName,
                        contactName: conn.contactName,
                        relationshipStrength: conn.relationshipStrength,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // Add new
                    await addDoc(connectionsCollection, {
                        userId: user.uid,
                        sector: conn.sector,
                        organizationName: conn.organizationName,
                        contactName: conn.contactName,
                        relationshipStrength: conn.relationshipStrength,
                        createdAt: serverTimestamp()
                    });
                }
            }

            setSuccess('Connections updated successfully!');
            // Update local state
            setDeletedIds([]);

            // Navigate back to profile
            setTimeout(() => router.push('/profile'), 1500);

        } catch (err) {
            console.error('Error saving connections:', err);
            setError('Failed to save connections. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-pattern">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8 animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.push('/profile')} className="text-[#00245D]/60 hover:text-[#00245D] transition-colors">
                                ← Back to Profile
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3 mt-4">
                            <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">🤝</span>
                            Manage Connections
                        </h1>
                    </div>

                    <div className="glass-panel p-8 animate-fadeIn">
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
                        ) : (
                            <>
                                {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><span>⚠️</span> {error}</div>}
                                {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><span>✓</span> {success}</div>}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {connections.map((conn, index) => (
                                        <div key={index} className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-white/30 shadow-lg hover:shadow-xl hover:bg-white/20 transition-all animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-[#00245D] flex items-center gap-2"><span className="w-6 h-6 bg-[#99D6EA]/50 text-[#00245D] rounded-lg flex items-center justify-center text-sm">{index + 1}</span> Connection</h3>
                                                {connections.length > 1 && <button type="button" onClick={() => removeConnectionEntry(index)} className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Remove</button>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Sector</label>
                                                    <select value={conn.sector} onChange={(e) => updateConnectionEntry(index, 'sector', e.target.value)} className="w-full px-4 py-3 border border-white/40 bg-white/30 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#99D6EA]/50 focus:border-white/60 transition-all">
                                                        {CONNECTION_SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Organization</label>
                                                    <input type="text" value={conn.organizationName} onChange={(e) => updateConnectionEntry(index, 'organizationName', e.target.value)} placeholder="Company or organization name" className="w-full px-4 py-3 border border-white/40 bg-white/30 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#99D6EA]/50 focus:border-white/60 transition-all" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[#00245D] mb-1.5">Contact Name (Optional)</label>
                                                <input type="text" value={conn.contactName} onChange={(e) => updateConnectionEntry(index, 'contactName', e.target.value)} placeholder="Your contact's name" className="w-full px-4 py-3 border border-white/40 bg-white/30 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#99D6EA]/50 focus:border-white/60 transition-all" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[#00245D] mb-2">Relationship Strength</label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {RELATIONSHIP_OPTIONS.map((opt) => (
                                                        <button key={opt.value} type="button" onClick={() => updateConnectionEntry(index, 'relationshipStrength', opt.value)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${conn.relationshipStrength === opt.value ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/25' : 'bg-white/20 border border-white/40 text-[#00245D] hover:bg-white/30 hover:border-white/60 backdrop-blur-sm'}`}>
                                                            <div className="font-semibold">{opt.label}</div>
                                                            <div className={`text-xs mt-1 ${conn.relationshipStrength === opt.value ? 'text-[#99D6EA]' : 'text-[#00245D]/60'}`}>{opt.description}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" onClick={addConnectionEntry} className="w-full py-4 border-2 border-dashed border-white/30 rounded-2xl text-[#00245D]/60 hover:border-white/60 hover:text-[#00245D] hover:bg-white/10 transition-all font-medium backdrop-blur-sm">+ Add Another Connection</button>

                                    <div className="flex justify-end pt-4">
                                        <button type="submit" disabled={submitting} className="px-8 py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                                            {submitting ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Saving...</span> : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
