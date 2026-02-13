'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import AdminNeedModal from '@/components/AdminNeedModal';
import {
  SKILL_CATEGORIES,
  SkillCategory,
  Need,
  ScoringConfig,
  InvitationWithDetails,
  InvitationType,
  UserWithStats,
  AnalyticsSummary,
  Skill,
  Connection
} from '@/types';
import GlassIcon from '@/components/GlassIcon';
import {
  ChartBar as LuChartBar,
  Users as LuUsers,
  ClipboardList as LuClipboardList,
  Bot as LuBot,
  Settings as LuSettings,
  Mail as LuMail,
  User as LuUser,
  Lock as LuLock,
  Trash2 as LuTrash2,
  TriangleAlert as LuTriangleAlert,
  Check as LuCheck,
  X as LuX,
  ChevronDown as LuChevronDown,
  Search as LuSearch,
  Plus as LuPlus,
  Filter as LuFilter,
  TrendingUp as LuTrendingUp,
  Calendar as LuCalendar,
  Link as LuLink,
  Globe as LuGlobe,
  Clock as LuClock,
  Pencil as LuPencil,
  Copy as LuCopy,
  Sparkles as LuSparkles
} from 'lucide-react';

type TabType = 'needs' | 'invitations' | 'users' | 'analytics' | 'scoring' | 'settings';

import { Suspense } from 'react';

function AdminDashboardContent() {
  const { user, userData } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['needs', 'invitations', 'users', 'analytics', 'scoring', 'settings'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  // Needs state
  const [needs, setNeeds] = useState<Need[]>([]);
  // Removed duplicate inline form state (newNeed, submitting, etc.)

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [newInvitationEmail, setNewInvitationEmail] = useState('');
  const [publicLinkName, setPublicLinkName] = useState('');
  const [invitationType, setInvitationType] = useState<InvitationType>('public');
  const [invitationLink, setInvitationLink] = useState('');
  const [invitingUser, setInvitingUser] = useState(false);
  const [invitationEmailStatus, setInvitationEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'onboarded' | 'pending' | 'admins' | 'public-link' | 'direct-signup'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteNeedConfirm, setShowDeleteNeedConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tooltip state for skills
  const [skillTooltip, setSkillTooltip] = useState<{
    x: number;
    y: number;
    skills: string[];
    visible: boolean;
  }>({ x: 0, y: 0, skills: [], visible: false });

  const handleTooltipEnter = (e: React.MouseEvent, skills: string[]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSkillTooltip({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      skills,
      visible: true
    });
  };

  const handleTooltipLeave = () => {
    setSkillTooltip(prev => ({ ...prev, visible: false }));
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Modal pagination state
  const [modalSkillsPage, setModalSkillsPage] = useState(1);
  const [modalConnectionsPage, setModalConnectionsPage] = useState(1);

  // Get all unique skills from users for autocomplete
  const uniqueSkills = Array.from(new Set(users.flatMap(u => u.skills || []))).sort();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const matches = uniqueSkills
        .filter(skill => skill.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (skill: string) => {
    setSearchQuery(skill);
    setShowSuggestions(false);
  };

  // Helper to parse Firestore timestamps
  const parseFirestoreDate = (date: any): Date | null => {
    if (!date) return null;
    // Handle Firestore Timestamp with _seconds
    if (date._seconds) {
      return new Date(date._seconds * 1000);
    }
    // Handle toDate method (Firestore Timestamp)
    if (typeof date.toDate === 'function') {
      return date.toDate();
    }
    // Handle regular Date or ISO string
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (date: any, options?: Intl.DateTimeFormatOptions): string => {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '-';
    return parsed.toLocaleDateString('en-US', options || { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (date: any): string => {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '-';
    return parsed.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Scoring state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Settings state - Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Settings state - Email
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const [loading, setLoading] = useState(true);

  // Edit need state
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);

  // Clear invitation state
  const [showClearInvitationsConfirm, setShowClearInvitationsConfirm] = useState(false);
  const [clearingInvitations, setClearingInvitations] = useState(false);

  // Needs search state
  const [needsSearchQuery, setNeedsSearchQuery] = useState('');

  // Pending responses count for notification badge
  const [pendingResponsesCount, setPendingResponsesCount] = useState(0);
  const [needResponseCounts, setNeedResponseCounts] = useState<Record<string, { total: number; pending: number }>>({});

  // Pagination state
  const [needsPage, setNeedsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const itemsPerPage = 10;


  // Fetch data on mount
  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const [needsRes, invitationsRes, usersRes, analyticsRes, configRes, responsesRes] = await Promise.all([
        fetch(`/api/needs?active=all`, { headers }),
        fetch(`/api/invitations?userId=${user.uid}`, { headers }),
        fetch(`/api/users?userId=${user.uid}`, { headers }),
        fetch(`/api/analytics?userId=${user.uid}`, { headers }),
        fetch('/api/scoring-config', { headers }),
        fetch('/api/need-responses', { headers }), // Fetch all responses for admin
      ]);

      const [needsData, invitationsData, usersData, analyticsData, configData, responsesData] = await Promise.all([
        needsRes.json(),
        invitationsRes.json(),
        usersRes.json(),
        analyticsRes.json(),
        configRes.json(),
        responsesRes.json(),
      ]);

      if (needsData.success) setNeeds(needsData.data.needs);
      if (invitationsData.success) setInvitations(invitationsData.data.invitations);
      if (usersData.success) setUsers(usersData.data.users);
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (configData.success) setScoringConfig(configData.data);

      // Count pending responses
      if (responsesData.success) {
        const pendingCount = responsesData.data.responses.filter(
          (r: { status: string }) => r.status === 'pending'
        ).length;
        setPendingResponsesCount(pendingCount);

        // Group responses by needId
        const responsesByNeed: Record<string, { total: number; pending: number }> = {};
        responsesData.data.responses.forEach((response: { needId: string; status: string }) => {
          if (!responsesByNeed[response.needId]) {
            responsesByNeed[response.needId] = { total: 0, pending: 0 };
          }
          responsesByNeed[response.needId].total++;
          if (response.status === 'pending') {
            responsesByNeed[response.needId].pending++;
          }
        });
        setNeedResponseCounts(responsesByNeed);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // User details modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{
    user: UserWithStats;
    skills: Skill[];
    connections: Connection[];
  } | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Reset modal pagination when modal opens and lock/unlock body scroll
  useEffect(() => {
    if (selectedUserId) {
      setModalSkillsPage(1);
      setModalConnectionsPage(1);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedUserId]);

  const fetchUserDetails = async (userId: string) => {
    if (!user) return;
    setLoadingUserDetails(true);
    setSelectedUserId(userId);
    setUserDetails(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/user-details?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      } else {
        alert('Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error loading user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Helper to format structured data into description - Removed as it moved to AdminNeedModal

  // handleCreateNeed - Removed as it moved to AdminNeedModal

  const toggleNeedStatus = async (needId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/needs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId,
          userId: user.uid,
          isActive: !currentStatus,
        }),
      });

      setNeeds(needs.map(n =>
        n.id === needId ? { ...n, isActive: !currentStatus } : n
      ));
      await fetchAllData();
    } catch (error) {
      console.error('Error toggling need status:', error);
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/needs?needId=${needId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setNeeds(needs.filter(n => n.id !== needId));
        setShowDeleteNeedConfirm(null);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete need');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For personal invitations, require email
    if (invitationType === 'personal' && !newInvitationEmail) {
      alert('Please enter an email address for personal invitations');
      return;
    }

    setInvitingUser(true);
    setInvitationLink('');
    setInvitationEmailStatus(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: invitationType,
          ...(invitationType === 'personal' ? { email: newInvitationEmail } : { name: publicLinkName || 'Public Invitation Link' }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvitationLink(data.data.invitationLink);
        if (invitationType === 'personal') {
          setInvitationEmailStatus({
            sent: data.data.emailSent,
            error: data.data.emailError,
          });
        }
        setNewInvitationEmail('');
        setPublicLinkName('');
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create invitation');
    } finally {
      setInvitingUser(false);
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleUserAdmin = async (targetUserId: string, currentStatus: boolean) => {
    if (!user) return;
    setTogglingAdmin(targetUserId);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId,
          updates: { isAdmin: !currentStatus },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(users.map(u =>
          u.id === targetUserId ? { ...u, isAdmin: !currentStatus } : u
        ));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status');
    } finally {
      setTogglingAdmin(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: userId,
          requestingUserId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setShowDeleteConfirm(null);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const runAIAnalysis = async () => {
    if (!user) return;
    setAnalyzingAI(true);
    setAiMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/scoring-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setScoringConfig(data.data);
        setAiMessage('AI analysis complete! New scoring weights applied.');
      } else {
        setAiMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiMessage('Failed to run AI analysis');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Apply status filter
    switch (userFilter) {
      case 'onboarded':
        filtered = filtered.filter(u => u.onboardingComplete);
        break;
      case 'pending':
        filtered = filtered.filter(u => !u.onboardingComplete);
        break;
      case 'admins':
        filtered = filtered.filter(u => u.isAdmin);
        break;
      case 'public-link':
        // Users who joined via public invitation link
        filtered = filtered.filter(u => u.invitationId && u.invitationType === 'public');
        break;
      case 'direct-signup':
        // Users who signed up directly (no invitation)
        filtered = filtered.filter(u => !u.invitationId);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query) ||
        u.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const startIndex = (usersPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getFilteredNeeds = () => {
    if (!needsSearchQuery.trim()) return needs;

    const query = needsSearchQuery.toLowerCase().trim();
    return needs.filter(need =>
      need.title.toLowerCase().includes(query) ||
      need.description.toLowerCase().includes(query) ||
      need.category.toLowerCase().includes(query)
    );
  };

  const getPaginatedNeeds = () => {
    const filtered = getFilteredNeeds();
    const startIndex = (needsPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getPaginatedInvitations = () => {
    const startIndex = (invitationsPage - 1) * itemsPerPage;
    return invitations.slice(startIndex, startIndex + itemsPerPage);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Error: Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('Error: Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    setPasswordMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordMessage('Password changed successfully!');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setPasswordMessage('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newEmail !== confirmNewEmail) {
      setEmailMessage('Error: Emails do not match');
      return;
    }

    if (!newEmail.includes('@')) {
      setEmailMessage('Error: Please enter a valid email address');
      return;
    }

    if (newEmail === user.email) {
      setEmailMessage('Error: New email is the same as current email');
      return;
    }

    setChangingEmail(true);
    setEmailMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailMessage('Email changed successfully! Please sign in again with your new email.');
        setNewEmail('');
        setConfirmNewEmail('');
        // Sign out after email change to force re-authentication
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setEmailMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setEmailMessage('Failed to change email');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleEditNeed = (need: Need) => {
    setEditingNeed(need);
    setIsNeedModalOpen(true);
  };

  // handleUpdateNeed - Removed as it moved to AdminNeedModal

  const handleClearInvitations = async () => {
    if (!user) return;
    setClearingInvitations(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations([]);
        setShowClearInvitationsConfirm(false);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to clear invitations');
    } finally {
      setClearingInvitations(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invitationId,
          action: 'resend',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Invitation resent to ${email}`);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to resend invitation');
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-pattern overflow-x-hidden">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 mt-20 sm:mt-24">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl font-black text-[#00245D] tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-base text-[#00245D]/60 font-medium">Manage community needs, users, and platform settings</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-10 p-1.5 glass-panel rounded-2xl w-fit animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuChartBar className="w-4 h-4" /> Stats
            </button>
            <button onClick={() => setActiveTab('invitations')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 ${activeTab === 'invitations' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuMail className="w-4 h-4" /> Invite
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 ${activeTab === 'users' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuUsers className="w-4 h-4" /> Users
            </button>
            <button onClick={() => setActiveTab('needs')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 relative ${activeTab === 'needs' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuClipboardList className="w-4 h-4" /> Needs
              {pendingResponsesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-4.5 px-1 flex items-center justify-center animate-pulse shadow-sm ring-2 ring-white/20">
                  {pendingResponsesCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('scoring')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 ${activeTab === 'scoring' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuBot className="w-4 h-4" /> AI
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 ${activeTab === 'settings' ? 'bg-[#00245D] text-white shadow-lg' : 'text-[#00245D]/70 hover:bg-[#00245D]/5'}`}>
              <LuSettings className="w-4 h-4" /> Settings
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00245D]"></div>
            </div>
          ) : (
            <>
              {/* Analytics Tab */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="glass-panel p-6 sm:p-8 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform duration-300">
                      <GlassIcon icon={LuUsers} size="lg" variant="primary" className="mb-3" />
                      <div className="text-sm text-[#00245D]/60 font-bold uppercase tracking-wider">Total Users</div>
                      <div className="text-3xl sm:text-4xl font-black text-[#00245D] mt-2">{analytics.totalUsers}</div>
                      <div className="text-xs text-[#00245D]/40 mt-1 font-semibold">{analytics.totalAdmins} admins</div>
                    </div>
                    <div className="glass-panel p-6 sm:p-8 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform duration-300">
                      <GlassIcon icon={LuCheck} size="lg" variant="success" className="mb-3" />
                      <div className="text-sm text-[#00245D]/60 font-bold uppercase tracking-wider">Onboarding</div>
                      <div className="text-3xl sm:text-4xl font-black text-green-600 mt-2">{analytics.onboardedUsers}</div>
                      <div className="text-xs text-[#00245D]/40 mt-1 font-semibold">{analytics.pendingOnboarding} pending</div>
                    </div>
                    <div className="glass-panel p-6 sm:p-8 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform duration-300">
                      <GlassIcon icon={LuTrendingUp} size="lg" variant="secondary" className="mb-3" />
                      <div className="text-sm text-[#00245D]/60 font-bold uppercase tracking-wider">Community Data</div>
                      <div className="text-3xl sm:text-4xl font-black text-[#00245D] mt-2">{analytics.totalSkills}</div>
                      <div className="text-xs text-[#00245D]/40 mt-1 font-semibold">{analytics.totalConnections} connections</div>
                    </div>
                    <div className="glass-panel p-6 sm:p-8 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform duration-300">
                      <GlassIcon icon={LuClipboardList} size="lg" variant="accent" className="mb-3" />
                      <div className="text-sm text-[#00245D]/60 font-bold uppercase tracking-wider">Active Needs</div>
                      <div className="text-3xl sm:text-4xl font-black text-[#00245D] mt-2">{analytics.activeNeeds}</div>
                      <div className="text-xs text-[#00245D]/40 mt-1 font-semibold">of {analytics.totalNeeds} total</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-panel p-8">
                      <h3 className="text-lg font-bold text-[#00245D] mb-6 flex items-center gap-2">
                        <GlassIcon icon={LuChartBar} size="sm" variant="primary" />
                        Top Skill Categories
                      </h3>
                      <div className="space-y-4">
                        {analytics.topSkillCategories.map((cat, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-semibold text-[#00245D]">{cat.category}</span>
                              <span className="font-bold text-[#00245D]">{cat.count}</span>
                            </div>
                            <div className="w-full bg-[#00245D]/5 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-[#00245D] to-[#99D6EA] h-full rounded-full" style={{ width: `${(cat.count / analytics.totalSkills) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel p-8">
                      <h3 className="text-lg font-bold text-[#00245D] mb-6 flex items-center gap-2">
                        <GlassIcon icon={LuLink} size="sm" variant="secondary" />
                        Top Connection Sectors
                      </h3>
                      <div className="space-y-4">
                        {analytics.topConnectionSectors.map((sector, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-semibold text-[#00245D]">{sector.sector}</span>
                              <span className="font-bold text-[#00245D]">{sector.count}</span>
                            </div>
                            <div className="w-full bg-[#00245D]/5 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-[#99D6EA] to-[#D4C4A8] h-full rounded-full" style={{ width: `${(sector.count / analytics.totalConnections) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div className="glass-panel p-8">
                    <h3 className="text-lg font-bold text-[#00245D] mb-6 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#00245D]/10 flex items-center justify-center text-sm"><LuClock size={16} /></span>
                      Recent Users
                    </h3>
                    <div className="space-y-3">
                      {analytics.recentUsers.map((u, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-[#00245D]/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00245D] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                              {u.profilePhoto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.profilePhoto} alt={u.email} className="w-full h-full object-cover" />
                              ) : (
                                u.email[0].toUpperCase()
                              )}
                            </div>
                            <span className="font-medium text-[#00245D]">{u.email}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#00245D]/40 bg-[#00245D]/5 px-2 py-1 rounded-lg">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Invitations Tab */}
              {activeTab === 'invitations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  {/* Create Invitation Card */}
                  <div className="glass-panel p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-[#00245D] mb-6 flex items-center gap-2">
                      <span className="w-8 h-8 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">✨</span>
                      Create New Invitation
                    </h3>

                    {/* Type Selector */}
                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={() => setInvitationType('public')}
                        className={`flex-1 py-4 px-4 rounded-xl font-medium transition-all border-2 ${invitationType === 'public'
                          ? 'bg-[#00245D] text-white border-[#00245D] shadow-lg scale-[1.02]'
                          : 'bg-white/50 text-[#00245D] border-transparent hover:bg-white hover:border-[#D4C4A8] hover:shadow-md'
                          }`}
                      >
                        <div className="text-2xl mb-2"><LuGlobe /></div>
                        <div className="text-sm font-bold">Public Link</div>
                        <div className="text-xs opacity-80 mt-1">Share with many</div>
                      </button>
                      <button
                        onClick={() => setInvitationType('personal')}
                        className={`flex-1 py-4 px-4 rounded-xl font-medium transition-all border-2 ${invitationType === 'personal'
                          ? 'bg-[#00245D] text-white border-[#00245D] shadow-lg scale-[1.02]'
                          : 'bg-white/50 text-[#00245D] border-transparent hover:bg-white hover:border-[#D4C4A8] hover:shadow-md'
                          }`}
                      >
                        <div className="text-2xl mb-2"><LuMail /></div>
                        <div className="text-sm font-bold">Personal</div>
                        <div className="text-xs opacity-80 mt-1">Email invite</div>
                      </button>
                    </div>

                    <form onSubmit={handleCreateInvitation} className="space-y-5">
                      {invitationType === 'public' ? (
                        <div>
                          <label className="block text-sm font-bold text-[#00245D] mb-2">Link Name (Optional)</label>
                          <input
                            type="text"
                            value={publicLinkName}
                            onChange={(e) => setPublicLinkName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none"
                            placeholder="e.g., Community Open Day"
                          />
                          <p className="text-xs text-[#00245D]/60 mt-2 flex items-center gap-1 font-medium">
                            <span>✓</span> Never expires • Unlimited uses
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-bold text-[#00245D] mb-2">Email Address</label>
                          <input
                            type="email"
                            value={newInvitationEmail}
                            onChange={(e) => setNewInvitationEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none"
                            placeholder="user@example.com"
                            required
                          />
                          <p className="text-xs text-[#00245D]/60 mt-2 flex items-center gap-1 font-medium">
                            <span><LuMail size={14} className="inline mr-1" /></span> Email sent automatically • Never expires
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={invitingUser}
                        className="w-full py-4 bg-gradient-to-r from-[#00245D] to-[#003380] text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {invitingUser ? (
                          <>
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <span>{invitationType === 'public' ? <LuLink size={14} /> : <LuMail size={14} />}</span>
                            {invitationType === 'public' ? 'Generate Public Link' : 'Send Invitation Email'}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Success Message */}
                    {invitationLink && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                            <span className="text-white font-bold text-lg">✓</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#00245D]">Link Created Successfully!</p>
                            {invitationType === 'public' && (
                              <p className="text-xs text-[#00245D]/70 font-medium">This link never expires.</p>
                            )}
                          </div>
                        </div>

                        {invitationEmailStatus && invitationType === 'personal' && (
                          <div className={`text-sm p-3 rounded-lg mb-3 border ${invitationEmailStatus.sent
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                            : 'bg-amber-100 border-amber-200 text-amber-800'
                            }`}>
                            {invitationEmailStatus.sent
                              ? '<LuCheck className="inline mr-1" /> Email invitation sent successfully!'
                              : `<LuTriangleAlert className="inline mr-1" /> Email failed: ${invitationEmailStatus.error || 'Share the link manually below.'}`}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={invitationLink}
                            readOnly
                            className="flex-1 px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl text-sm font-mono text-[#00245D] outline-none"
                          />
                          <button
                            onClick={() => {
                              copyToClipboard(invitationLink);
                              alert('Link copied to clipboard!');
                            }}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <LuCopy size={14} className="mr-1" /> Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Links Card */}
                  <div className="glass-panel p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[#00245D] flex items-center gap-2">
                        <span className="w-8 h-8 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm"><LuClipboardList size={16} /></span>
                        Active Invitation Links
                      </h3>
                      {invitations.length > 0 && (
                        <button
                          onClick={() => setShowClearInvitationsConfirm(true)}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-bold uppercase tracking-wider"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Permanent Public Invitation Link - Always Displayed */}
                      {(() => {
                        const publicLink = invitations.find(inv => inv.type === 'public');
                        if (publicLink) {
                          return (
                            <div className="p-5 rounded-2xl border-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm shadow-md shadow-blue-200"><LuGlobe size={16} /></span>
                                    <h4 className="font-bold text-[#00245D]">{publicLink.name || 'Public Invitation Link'}</h4>
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ring-emerald-200">Active</span>
                                  </div>
                                  <p className="text-xs text-[#00245D]/60 mt-2 font-medium ml-10">
                                    Created {new Date(publicLink.createdAt).toLocaleDateString()} • <span className="text-blue-600 font-bold">{users.filter(u => u.invitationId === publicLink.id).length} sign-ups</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 items-center bg-white rounded-xl p-2 border-2 border-blue-100/50">
                                <input
                                  type="text"
                                  value={publicLink.invitationLink || ''}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-[#00245D] outline-none select-all font-medium"
                                />
                                <button
                                  onClick={() => {
                                    copyToClipboard(publicLink.invitationLink || '', publicLink.id);
                                  }}
                                  className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-xs ${copiedLinkId === publicLink.id
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    }`}
                                >
                                  {copiedLinkId === publicLink.id ? (
                                    <>✓ Copied</>
                                  ) : (
                                    <>Copy Link</>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteInvitation(publicLink.id)}
                                  className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors"
                                >
                                  <LuTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Other invitations */}
                      {invitations.length === 0 ? (
                        <div className="text-center py-16 px-4 rounded-3xl bg-[#00245D]/[0.02] border-2 border-dashed border-[#00245D]/10">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-4xl">
                            🔗
                          </div>
                          <p className="text-[#00245D] font-bold text-lg">No invitation links yet</p>
                          <p className="text-[#00245D]/50 text-sm mt-1">Create your first link to start inviting members</p>
                        </div>
                      ) : (
                        <>
                          {getPaginatedInvitations().filter(inv => inv.type !== 'public').map(inv => (
                            <div
                              key={inv.id}
                              className="p-4 rounded-2xl border border-[#D4C4A8]/50 bg-white/40 hover:bg-white/80 transition-all hover:shadow-md group"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-lg bg-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm border border-[#D4C4A8]/30">
                                      {inv.type === 'public' ? <LuGlobe size={14} /> : <LuMail size={14} />}
                                    </span>
                                    <span className="font-bold text-[#00245D] truncate">
                                      {inv.type === 'public' ? (inv.name || 'Public Link') : inv.email}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#00245D]/60 ml-10">
                                    <span className="font-medium">Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                                    {inv.type === 'public' && (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        {users.filter(u => u.invitationId === inv.id).length} sign-ups
                                      </span>
                                    )}
                                    {inv.type === 'personal' && inv.status === 'accepted' && (
                                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                        Joined {inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString() : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : inv.status === 'expired'
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : inv.type === 'public'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}>
                                    {inv.type === 'public' ? '∞ Active' : inv.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4 pt-3 border-t border-[#00245D]/5 ml-10">
                                {inv.invitationLink && (
                                  <button
                                    onClick={() => copyToClipboard(inv.invitationLink!, inv.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${copiedLinkId === inv.id
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white border border-[#D4C4A8]/50 text-[#00245D] hover:bg-[#00245D]/5'
                                      }`}
                                  >
                                    {copiedLinkId === inv.id ? (
                                      <>✓ Copied!</>
                                    ) : (
                                      <>Copy Link</>
                                    )}
                                  </button>
                                )}
                                {inv.type === 'personal' && inv.status === 'pending' && (
                                  <button
                                    onClick={() => handleResendInvitation(inv.id, inv.email || '')}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                  >
                                    Resend Email
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvitation(inv.id)}
                                  className="ml-auto px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                          <Pagination
                            currentPage={invitationsPage}
                            totalItems={invitations.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setInvitationsPage}
                            className="mt-6"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="glass-panel p-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-[#00245D] flex items-center gap-2">
                      <GlassIcon icon={LuUsers} size="sm" /> User Management
                    </h2>
                    <p className="text-base text-[#00245D]/60 mt-2 font-medium">Manage users, assign admin roles, and monitor onboarding status.</p>
                  </div>

                  {/* Search Bar with Autocomplete */}
                  <div className="mb-6 relative z-20">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <span className="text-xl text-[#00245D]/40 group-focus-within:text-[#00245D] transition-colors">🔍</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by email, name, or skills..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full pl-14 pr-6 py-4 glass-panel bg-white/15 border border-white/40 rounded-2xl focus:ring-4 focus:ring-[#00245D]/5 focus:border-white/60 transition-all shadow-lg hover:shadow-xl text-lg placeholder-[#00245D]/30 text-[#00245D]"
                      />
                      {/* Keyboard shortcut hint */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none opacity-40">
                        <kbd className="px-2 py-1 bg-white/20 border border-white/40 rounded text-xs font-mono text-[#00245D]">Type to search</kbd>
                      </div>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="mt-2 glass-panel overflow-hidden animate-fadeIn shadow-2xl absolute w-full z-50">
                        <div className="px-4 py-2 bg-[#00245D]/5 border-b border-white/20 text-xs font-semibold text-[#00245D]/60 uppercase tracking-wider backdrop-blur-md">
                          Suggested Skills
                        </div>
                        {suggestions.map((skill, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion(skill)}
                            className="w-full text-left px-5 py-3 hover:bg-white/40 transition-colors flex items-center gap-3 group backdrop-blur-md"
                          >
                            <span className="w-8 h-8 rounded-lg bg-[#99D6EA]/20 flex items-center justify-center text-sm group-hover:bg-[#00245D] group-hover:text-white transition-colors">
                              💡
                            </span>
                            <div>
                              <div className="font-medium text-[#00245D] group-hover:translate-x-1 transition-transform">
                                {skill}
                              </div>
                              <div className="text-xs text-[#00245D]/50">
                                Found in {users.filter(u => u.skills?.includes(skill)).length} users
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 mb-8 flex-wrap">
                    <button
                      onClick={() => setUserFilter('all')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${userFilter === 'all'
                        ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20 ring-2 ring-[#00245D] ring-offset-2 ring-offset-white/10'
                        : 'glass-panel hover:bg-white/40 text-[#00245D]'
                        }`}
                    >
                      All Users ({users.length})
                    </button>
                    <button
                      onClick={() => setUserFilter('admins')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userFilter === 'admins'
                        ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20 ring-2 ring-[#00245D] ring-offset-2 ring-offset-white/10'
                        : 'glass-panel hover:bg-white/40 text-[#00245D]'
                        }`}
                    >
                      <span>👑</span> Admins
                    </button>
                    <button
                      onClick={() => setUserFilter('public-link')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userFilter === 'public-link'
                        ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20 ring-2 ring-[#00245D] ring-offset-2 ring-offset-white/10'
                        : 'glass-panel hover:bg-white/40 text-[#00245D]'
                        }`}
                    >
                      <span><LuGlobe size={14} /></span> Public Link Joiners
                    </button>
                    <button
                      onClick={() => setUserFilter('direct-signup')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userFilter === 'direct-signup'
                        ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20 ring-2 ring-[#00245D] ring-offset-2 ring-offset-white/10'
                        : 'glass-panel hover:bg-white/40 text-[#00245D]'
                        }`}
                    >
                      <span>👤</span> Direct Sign-ups
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-3xl glass-panel shadow-2xl">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#00245D]/5 border-b border-white/20 backdrop-blur-sm">
                          <th className="text-left py-5 px-4 sm:px-6 text-xs font-bold text-[#00245D] uppercase tracking-wider w-1/4 min-w-[220px]">Email</th>
                          <th className="text-left py-5 px-4 sm:px-6 text-xs font-bold text-[#00245D] uppercase tracking-wider w-[150px]">Name</th>
                          <th className="text-left py-5 px-6 text-xs font-bold text-[#00245D] uppercase tracking-wider min-w-[100px]">Join Method</th>
                          <th className="text-left py-5 px-6 text-xs font-bold text-[#00245D] uppercase tracking-wider w-1/3 min-w-[300px]">Skills</th>
                          <th className="text-center py-5 px-2 text-xs font-bold text-[#00245D] uppercase tracking-wider w-[100px]">Connections</th>
                          <th className="text-center py-5 px-2 text-xs font-bold text-[#00245D] uppercase tracking-wider w-[100px]">Admin</th>
                          <th className="text-center py-5 px-2 text-xs font-bold text-[#00245D] uppercase tracking-wider w-[80px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20">
                        {getPaginatedUsers().length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center">
                              <div className="flex flex-col items-center justify-center opacity-60">
                                <span className="text-5xl mb-4">🔍</span>
                                <span className="font-medium text-[#00245D] text-lg">No users found matching your filters</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getPaginatedUsers().map(u => (
                            <tr
                              key={u.id}
                              onClick={() => fetchUserDetails(u.id)}
                              className="hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                            >
                              <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-[#00245D] group-hover:text-[#003380] transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#00245D]/10 flex items-center justify-center text-[#00245D] text-xs font-bold overflow-hidden shrink-0">
                                    {u.profilePhoto ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={u.profilePhoto} alt={u.email} className="w-full h-full object-cover" />
                                    ) : (
                                      u.email[0].toUpperCase()
                                    )}
                                  </div>
                                  {u.email}
                                </div>
                              </td>
                              <td className="py-4 px-4 sm:px-6 text-sm font-medium text-[#00245D]/80 whitespace-nowrap">{u.displayName || '-'}</td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-medium text-[#00245D]/60 tracking-wide">
                                  {u.invitationId || u.invitationType === 'public' ? 'Link' : 'Direct'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-none mask-linear-fade">
                                  {(() => {
                                    const allSkills = u.skills || [];

                                    if (allSkills.length === 0) {
                                      return <span className="text-[10px] font-medium text-[#00245D]/40 italic whitespace-nowrap">No skills listed</span>;
                                    }

                                    return allSkills.map((skill, idx) => {
                                      const isMatch = searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase());
                                      return (
                                        <span
                                          key={idx}
                                          className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${isMatch
                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm scale-110'
                                            : 'bg-[#00245D]/5 text-[#00245D] border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur-sm'
                                            }`}
                                        >
                                          {skill}
                                        </span>
                                      );
                                    });
                                  })()}
                                </div>
                              </td>
                              <td className="py-4 px-2 text-sm text-center">
                                <span className={`inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-lg text-xs font-bold transition-all ${u.connectionsCount > 0
                                  ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-100 shadow-sm'
                                  : 'bg-transparent text-[#00245D]/30'
                                  }`}>
                                  {u.connectionsCount > 0 ? u.connectionsCount : '-'}
                                </span>
                              </td>

                              <td className="py-4 px-2 text-center">
                                {u.isPrimaryAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#00245D] text-white shadow-md ring-2 ring-[#00245D]/10 cursor-not-allowed opacity-90" title="Primary admin cannot be changed">
                                    👑 Primary
                                  </span>
                                ) : u.isAdmin ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleUserAdmin(u.id, u.isAdmin); }}
                                    disabled={togglingAdmin === u.id || u.id === user?.uid}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/90 border border-[#00245D]/20 text-[#00245D] hover:bg-[#00245D] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-[#00245D] z-10 relative shadow-sm hover:shadow-md"
                                    title={u.id === user?.uid ? "Cannot change your own admin status" : "Click to remove admin"}
                                  >
                                    {togglingAdmin === u.id ? <span className="animate-spin text-sm">↻</span> : 'Admin'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleUserAdmin(u.id, u.isAdmin); }}
                                    disabled={togglingAdmin === u.id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/40 border border-[#D4C4A8]/40 text-[#00245D]/60 hover:bg-white hover:border-[#00245D]/50 hover:text-[#00245D] transition-all disabled:opacity-50 z-10 relative shadow-sm"
                                    title="Click to make admin"
                                  >
                                    {togglingAdmin === u.id ? <span className="animate-spin text-sm">↻</span> : 'Member'}
                                  </button>
                                )}
                              </td>
                              <td className="py-4 px-2 text-center">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(u.id); }}
                                  disabled={u.id === user?.uid}
                                  className="w-8 h-8 rounded-lg bg-red-50/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-500 z-10 relative hover:shadow-md"
                                  title="Delete User"
                                >
                                  <LuTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={usersPage}
                    totalItems={getFilteredUsers().length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setUsersPage}
                    className="mt-4"
                  />
                </div>
              )}



              {/* Needs Tab */}
              {activeTab === 'needs' && (
                <div className="space-y-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  {/* Needs Management Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#00245D] flex items-center gap-2">
                      <GlassIcon icon={LuClipboardList} size="sm" variant="secondary" />
                      Manage Needs
                    </h2>
                    <button
                      onClick={() => { setEditingNeed(null); setIsNeedModalOpen(true); }}
                      className="px-6 py-3 bg-gradient-to-r from-[#00245D] to-[#003380] text-white rounded-xl font-bold text-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      <LuSparkles size={18} />
                      Create Need
                    </button>
                  </div>

                  <div className="glass-panel p-8 h-fit">

                    {/* Needs Search Bar */}
                    <div className="mb-6 relative z-10">
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#00245D]/40 group-focus-within:text-[#00245D] transition-colors">🔍</span>
                        <input
                          type="text"
                          placeholder="Search needs by title, description, or category..."
                          value={needsSearchQuery}
                          onChange={(e) => setNeedsSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-10 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none placeholder-[#00245D]/40"
                        />
                        {needsSearchQuery && (
                          <button
                            onClick={() => setNeedsSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#00245D]/40 hover:text-[#00245D] hover:bg-[#00245D]/5 rounded-lg transition-all"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {needsSearchQuery && (
                        <p className="mt-3 text-xs font-bold text-[#00245D]/60 ml-1">
                          Found {getFilteredNeeds().length} matches for &quot;{needsSearchQuery}&quot;
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {getFilteredNeeds().length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center opacity-50">
                            <span className="text-4xl mb-2">🔍</span>
                            <span className="font-medium text-[#00245D]">
                              {needsSearchQuery ? `No needs found matching "${needsSearchQuery}"` : 'No needs here yet. Create one!'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {getPaginatedNeeds().map(need => {
                            const responseCounts = needResponseCounts[need.id];
                            const hasPendingResponses = responseCounts && responseCounts.pending > 0;

                            return (
                              <div key={need.id} className="p-5 glass-panel hover:bg-white/10 transition-all group">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <Link href={`/admin/needs/${need.id}`} className="flex-1 min-w-0 group/Link">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h3 className="font-bold text-[#00245D] text-lg truncate group-hover/link:text-[#003380] transition-colors cursor-pointer">
                                        {need.title}
                                      </h3>
                                      {hasPendingResponses && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-pulse shadow-sm flex items-center gap-1">
                                          🔔 {responseCounts.pending} New
                                        </span>
                                      )}
                                      {responseCounts && !hasPendingResponses && responseCounts.total > 0 && (
                                        <span className="bg-[#99D6EA]/20 text-[#00245D] text-[10px] font-bold rounded-full px-2 py-0.5 border border-[#99D6EA]/50">
                                          {responseCounts.total} response{responseCounts.total !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold uppercase tracking-wider text-[#00245D]/50 bg-[#00245D]/5 px-2 py-0.5 rounded-lg">
                                        {need.category}
                                      </span>
                                    </div>
                                  </Link>
                                  <button
                                    onClick={() => toggleNeedStatus(need.id, need.isActive)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all ${need.isActive
                                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                      }`}
                                  >
                                    {need.isActive ? 'Active' : 'Inactive'}
                                  </button>
                                </div>
                                <p className="text-sm text-[#00245D]/70 mb-4 line-clamp-2 leading-relaxed">
                                  {need.description}
                                </p>
                                <div className="flex gap-2 pt-3 border-t border-[#00245D]/5">
                                  <Link
                                    href={`/admin/needs/${need.id}`}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${hasPendingResponses
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
                                      : 'bg-[#00245D] text-white hover:bg-[#003380] hover:shadow-md'
                                      }`}
                                  >
                                    {hasPendingResponses ? '🔔 Check Responses' : '👥 View Matches'}
                                  </Link>
                                  <button
                                    onClick={() => handleEditNeed(need)}
                                    className="px-4 py-2 bg-white border border-[#D4C4A8] text-[#00245D] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#00245D]/5 transition-all"
                                  >
                                    <LuPencil size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteNeedConfirm(need.id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-all"
                                  >
                                    <LuTrash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <Pagination
                            currentPage={needsPage}
                            totalItems={getFilteredNeeds().length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={(page) => { setNeedsPage(page); }}
                            className="mt-6 flex justify-center"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Scoring Tab */}
              {activeTab === 'scoring' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-[#00245D] mb-6 flex items-center gap-2">
                      <GlassIcon icon={LuBot} size="sm" variant="primary" />
                      AI Scoring Optimization
                    </h2>
                    <p className="text-[#00245D]/70 mb-6 leading-relaxed">
                      Use AI to analyze community data and optimize the scoring algorithm weights for better matching.
                    </p>
                    <button
                      onClick={runAIAnalysis}
                      disabled={analyzingAI}
                      className="w-full py-4 bg-[#00245D] text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#00245D] to-[#003380]"
                    >
                      {analyzingAI ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>Analyzing...</>
                      ) : (
                        '🔄 Run AI Analysis'
                      )}
                    </button>
                    {aiMessage && (
                      <div className={`mt-6 text-sm font-bold p-4 rounded-xl border ${aiMessage.includes('Error')
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {aiMessage}
                      </div>
                    )}
                    {scoringConfig?.aiAnalysis && (
                      <div className="mt-6 p-6 bg-[#99D6EA]/10 rounded-xl border border-[#99D6EA]/30">
                        <h3 className="font-bold text-[#00245D] mb-3 flex items-center gap-2">
                          <span className="text-lg">✨</span> Last AI Analysis
                        </h3>
                        <p className="text-sm text-[#00245D]/80 mb-4 leading-relaxed bg-white/50 p-4 rounded-lg border border-[#99D6EA]/20">
                          {scoringConfig.aiAnalysis.reasoning}
                        </p>
                        <div className="flex gap-4 text-xs font-bold text-[#00245D]/60 uppercase tracking-wider">
                          <span className="bg-white/50 px-3 py-1 rounded-lg">Confidence: {Math.round((scoringConfig.aiAnalysis.confidence || 0) * 100)}%</span>
                          <span className="bg-white/50 px-3 py-1 rounded-lg">Data Points: {scoringConfig.aiAnalysis.dataPointsAnalyzed}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-[#00245D] mb-6 flex items-center gap-2">
                      <GlassIcon icon={LuChartBar} size="sm" variant="primary" />
                      Current Scoring Weights
                    </h2>
                    {scoringConfig ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider mb-3">Base Weights</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {Object.entries(scoringConfig.weights).map(([k, v]) => (
                              <div key={k} className="glass-panel p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:bg-white/10 transition-colors">
                                <div className="text-[10px] font-bold text-[#00245D]/60 uppercase tracking-wider">{k}</div>
                                <div className="font-black text-xl text-[#00245D]">{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider mb-3">Willingness Multipliers</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {Object.entries(scoringConfig.willingnessMultipliers).map(([k, v]) => (
                              <div key={k} className="bg-[#99D6EA]/20 p-3 rounded-xl border border-[#99D6EA]/30 flex flex-col items-center justify-center gap-1 group hover:bg-[#99D6EA]/30 transition-colors">
                                <div className="text-[10px] font-bold text-[#00245D]/60 uppercase tracking-wider text-center leading-tight min-h-[2.5em] flex items-center">{k.replace('_', ' ')}</div>
                                <div className="font-black text-lg text-[#00245D]">{v}x</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#00245D] uppercase tracking-wider mb-3">Relationship Multipliers</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {Object.entries(scoringConfig.relationshipMultipliers).map(([k, v]) => (
                              <div key={k} className="bg-[#00245D]/5 p-3 rounded-xl border border-[#00245D]/10 flex flex-col items-center justify-center gap-1 group hover:bg-[#00245D]/10 transition-colors">
                                <div className="text-[10px] font-bold text-[#00245D]/60 uppercase tracking-wider text-center">{k.replace('_', ' ')}</div>
                                <div className="font-black text-lg text-[#00245D]">{v}x</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-[#00245D]/60">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00245D] mb-4"></div>
                        <p className="font-medium">Loading configuration...</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="animate-fadeIn space-y-8" style={{ animationDelay: '0.2s' }}>
                  {/* Account Settings Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Email Change Card */}
                    <div className="glass-panel p-8">
                      <h2 className="text-xl font-bold text-[#00245D] mb-6 flex items-center gap-2">
                        <GlassIcon icon={LuMail} size="sm" variant="secondary" />
                        Change Email
                      </h2>
                      <p className="text-[#00245D]/70 mb-6 text-sm">
                        Update your admin account email address. You will need to verify the new email.
                      </p>
                      <form onSubmit={handleChangeEmail} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-[#00245D] uppercase tracking-wider mb-2">Current Email</label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full px-4 py-3 bg-[#D4C4A8]/10 border-2 border-[#D4C4A8]/30 rounded-xl text-[#00245D]/60 cursor-not-allowed font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#00245D] uppercase tracking-wider mb-2">New Email</label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none placeholder-[#00245D]/30"
                            placeholder="Enter new email"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#00245D] uppercase tracking-wider mb-2">Confirm New Email</label>
                          <input
                            type="email"
                            value={confirmNewEmail}
                            onChange={(e) => setConfirmNewEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none placeholder-[#00245D]/30"
                            placeholder="Confirm new email"
                            required
                          />
                        </div>
                        {emailMessage && (
                          <div className={`text-xs font-bold p-3 rounded-xl border ${emailMessage.includes('Error')
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                            {emailMessage}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={changingEmail}
                          className="w-full py-4 bg-[#00245D] text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all bg-gradient-to-r from-[#00245D] to-[#003380]"
                        >
                          {changingEmail ? 'Updating...' : 'Update Email'}
                        </button>
                      </form>
                    </div>

                    {/* Password Change Card */}
                    <div className="glass-panel p-8">
                      <h2 className="text-xl font-bold text-[#00245D] mb-6 flex items-center gap-2">
                        <GlassIcon icon={LuLock} size="sm" variant="accent" />
                        Change Password
                      </h2>
                      <p className="text-[#00245D]/70 mb-6 text-sm">
                        Update your admin account password. Make sure it&apos;s strong and secure.
                      </p>
                      <form onSubmit={handleChangePassword} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-[#00245D] uppercase tracking-wider mb-2">New Password</label>
                          <PasswordInput
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none placeholder-[#00245D]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#00245D] uppercase tracking-wider mb-2">Confirm New Password</label>
                          <PasswordInput
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full px-4 py-3 bg-white/50 border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all outline-none placeholder-[#00245D]/30"
                          />
                        </div>
                        {passwordMessage && (
                          <div className={`text-xs font-bold p-3 rounded-xl border ${passwordMessage.includes('Error')
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                            {passwordMessage}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full py-4 bg-[#00245D] text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all bg-gradient-to-r from-[#00245D] to-[#003380]"
                        >
                          {changingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Admin Profile Card */}
                  {/* Admin Profile Card */}
                  <div className="glass-panel p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/20 bg-white/10">
                      <h2 className="text-xl font-bold text-[#00245D] flex items-center gap-2">
                        <GlassIcon icon={LuUser} size="sm" variant="primary" />
                        Admin Profile
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/30">
                      {/* Column 1: Profile Identity */}
                      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center hover:bg-white/5 transition-colors">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#00245D] to-[#003380] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/30 overflow-hidden">
                          {userData?.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={userData.profilePhoto} alt={userData?.displayName || 'Profile'} className="w-full h-full object-cover" />
                          ) : (
                            userData?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'
                          )}
                        </div>
                        <div className="w-full px-2">
                          <p className="font-bold text-[#00245D] text-sm truncate" title={user?.email || ''}>
                            {user?.email}
                          </p>
                          <span className="inline-flex items-center gap-1.5 bg-[#00245D]/10 text-[#00245D] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 border border-[#00245D]/20">
                            👑 Administrator
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Total Users Stat */}
                      <div className="p-8 flex flex-col items-center justify-center gap-2 text-center hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 bg-[#99D6EA]/20 rounded-2xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                          👥
                        </div>
                        <div className="text-5xl font-black text-[#00245D] tracking-tight">
                          {users.length}
                        </div>
                        <div className="text-xs font-bold text-[#00245D]/60 uppercase tracking-widest mt-1">
                          Total Users
                        </div>
                      </div>

                      {/* Column 3: Active Needs Stat */}
                      <div className="p-8 flex flex-col items-center justify-center gap-2 text-center hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 bg-[#D4C4A8]/20 rounded-2xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                          <LuClipboardList size={16} />
                        </div>
                        <div className="text-5xl font-black text-[#00245D] tracking-tight">
                          {needs.length}
                        </div>
                        <div className="text-xs font-bold text-[#00245D]/60 uppercase tracking-widest mt-1">
                          Active Needs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main >

        {/* Delete Confirmation Modal */}
        {
          showDeleteConfirm && (
            <div className="fixed inset-0 bg-[#00245D]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-panel p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all">
                <h3 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">
                  <LuTriangleAlert className="text-2xl text-red-500" /> Confirm Delete User
                </h3>
                <p className="text-[#00245D]/70 mb-8 leading-relaxed">
                  Are you sure you want to delete this user? This action cannot be undone and will remove all their data.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-5 py-2.5 bg-[#00245D]/5 text-[#00245D] rounded-xl hover:bg-[#00245D]/10 transition-colors font-bold uppercase tracking-wider text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg hover:shadow-xl transition-all font-bold uppercase tracking-wider text-xs"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Delete Need Confirmation Modal */}
        {
          showDeleteNeedConfirm && (
            <div className="fixed inset-0 bg-[#00245D]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-panel p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all">
                <h3 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">
                  <LuTriangleAlert className="text-2xl text-red-500" /> Confirm Delete Need
                </h3>
                <p className="text-[#00245D]/70 mb-8 leading-relaxed">
                  Are you sure you want to delete this need? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteNeedConfirm(null)}
                    className="px-5 py-2.5 bg-[#00245D]/5 text-[#00245D] rounded-xl hover:bg-[#00245D]/10 transition-colors font-bold uppercase tracking-wider text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteNeed(showDeleteNeedConfirm)}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg hover:shadow-xl transition-all font-bold uppercase tracking-wider text-xs"
                  >
                    Delete Need
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Clear Invitations Confirmation Modal */}
        {
          showClearInvitationsConfirm && (
            <div className="fixed inset-0 bg-[#00245D]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-panel p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all">
                <h3 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">
                  <LuTrash2 className="text-2xl" /> Clear All Invitations
                </h3>
                <p className="text-[#00245D]/70 mb-8 leading-relaxed">
                  Are you sure you want to clear all invitation history? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowClearInvitationsConfirm(false)}
                    className="px-5 py-2.5 bg-[#00245D]/5 text-[#00245D] rounded-xl hover:bg-[#00245D]/10 transition-colors font-bold uppercase tracking-wider text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearInvitations}
                    disabled={clearingInvitations}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg hover:shadow-xl transition-all font-bold uppercase tracking-wider text-xs disabled:opacity-50"
                  >
                    {clearingInvitations ? 'Clearing...' : 'Clear All'}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* User Details Modal - Premium Redesign */}
        {selectedUserId && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-[#00245D]/20 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-4xl my-auto overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/40" style={{ maxHeight: 'min(95vh, 900px)' }}>
              {loadingUserDetails ? (
                <div className="p-16 flex flex-col justify-center items-center gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00245D]/20 border-t-[#00245D]"></div>
                  <p className="text-[#00245D]/60 animate-pulse">Loading user profile...</p>
                </div>
              ) : userDetails ? (
                <>
                  {/* Hero Header - Compact and Responsive */}
                  <div className="relative shrink-0 bg-gradient-to-r from-[#00245D] via-[#003380] to-[#00245D] px-4 py-4 sm:px-6 sm:py-5 text-white overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#99D6EA] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 z-10"
                    >
                      <span className="text-lg sm:text-xl">✕</span>
                    </button>

                    <div className="relative flex items-center gap-3 sm:gap-5">
                      {/* Avatar - Fixed size, never shrinks */}
                      <div className="relative shrink-0">
                        {userDetails.user.profilePhoto ? (
                          <img
                            src={userDetails.user.profilePhoto}
                            alt="Profile"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-2 sm:border-4 border-white/20 shadow-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-[#99D6EA] to-[#D4C4A8] flex items-center justify-center text-3xl sm:text-5xl font-bold text-[#00245D] border-2 sm:border-4 border-white/20 shadow-xl">
                            {userDetails.user.displayName
                              ? userDetails.user.displayName[0].toUpperCase()
                              : userDetails.user.email[0].toUpperCase()}
                          </div>
                        )}
                        {userDetails.user.isAdmin && (
                          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <span className="text-sm sm:text-base">👑</span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0 pr-8 sm:pr-12">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h2 className="text-xl sm:text-3xl font-bold break-words">
                            {userDetails.user.displayName || `${(userDetails.user as any).firstName || ''} ${(userDetails.user as any).lastName || ''}`.trim() || 'No Name'}
                          </h2>
                          {userDetails.user.isPrimaryAdmin && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold rounded-full">PRIMARY</span>
                          )}
                        </div>
                        <p className="text-white/70 text-xs sm:text-sm truncate mb-2 sm:mb-3">{userDetails.user.email}</p>

                        {/* Quick Stats - Compact on mobile */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            <span>💡</span>
                            <span className="font-semibold">{userDetails.skills.length}</span>
                            <span className="text-white/60 hidden sm:inline">Skills</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            <span>🤝</span>
                            <span className="font-semibold">{userDetails.connections.length}</span>
                            <span className="text-white/60 hidden sm:inline">Connections</span>
                          </div>
                          <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${userDetails.user.onboardingComplete ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                            <span>{userDetails.user.onboardingComplete ? '✓' : '⏳'}</span>
                            <span className="hidden sm:inline">{userDetails.user.onboardingComplete ? 'Onboarded' : 'Pending'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Body - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-[#f0f4f8]/50 to-white/20">

                    {/* Personal Information Card */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/30 overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-white/20 bg-white/10">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">👤</span>
                          Personal Information
                        </h3>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                        {/* First Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">First Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).firstName || '-'}</p>
                        </div>
                        {/* Last Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Last Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).lastName || '-'}</p>
                        </div>
                        {/* Display Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Display Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{userDetails.user.displayName || '-'}</p>
                        </div>
                        {/* Email */}
                        <div className="space-y-0.5 col-span-2 lg:col-span-1">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Email</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{userDetails.user.email}</p>
                        </div>
                        {/* Phone */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Phone</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).phoneNumber || '-'}</p>
                        </div>
                        {/* Location */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Location</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).location || '-'}</p>
                        </div>
                        {/* LinkedIn */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">LinkedIn</label>
                          {(userDetails.user as any).linkedinUrl ? (
                            <a
                              href={(userDetails.user as any).linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm sm:text-base font-medium text-blue-600 hover:underline truncate block"
                            >
                              View ↗
                            </a>
                          ) : (
                            <p className="text-sm sm:text-base font-medium text-[#00245D]">-</p>
                          )}
                        </div>
                        {/* Bio - Full Width */}
                        {(userDetails.user as any).bio && (
                          <div className="space-y-0.5 col-span-2 lg:col-span-3">
                            <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Bio</label>
                            <p className="text-xs sm:text-sm font-medium text-[#00245D] bg-[#00245D]/5 p-2 sm:p-3 rounded-lg leading-relaxed">
                              {(userDetails.user as any).bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Information Card */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/30 overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-white/20 bg-gradient-to-r from-[#99D6EA]/5 to-transparent">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#99D6EA]/20 rounded-lg flex items-center justify-center text-sm"><LuSettings size={14} /></span>
                          Account Information
                        </h3>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                        {/* User ID */}

                        {/* Joined Date */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Joined Date</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D]">
                            {formatDate(userDetails.user.createdAt)}
                          </p>
                        </div>
                        {/* Join Method */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Join Method</label>
                          <p className="text-xs sm:text-sm font-medium text-[#00245D]">
                            {userDetails.user.invitationId
                              ? (userDetails.user.invitationType === 'public' ? '<LuGlobe size={14} className="inline mr-1" /> Public Link' : '<LuMail size={14} className="inline mr-1" /> Personal Invite')
                              : '👤 Direct Sign-up'}
                          </p>
                        </div>
                        {/* Admin Status */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Admin Status</label>
                          <div className="flex items-center gap-1.5">
                            {userDetails.user.isPrimaryAdmin ? (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] sm:text-xs font-bold">👑 Primary</span>
                            ) : userDetails.user.isAdmin ? (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#00245D] text-white rounded-full text-[10px] sm:text-xs font-bold">Admin</span>
                            ) : (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs font-medium">Member</span>
                            )}
                          </div>
                        </div>
                        {/* Onboarding Status */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Onboarding</label>
                          <div className={`flex w-fit items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${userDetails.user.onboardingComplete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                            }`}>
                            <span>{userDetails.user.onboardingComplete ? '✓' : '⏳'}</span>
                            {userDetails.user.onboardingComplete ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                        {/* Invited By */}
                        {(userDetails.user as any).invitedBy && (
                          <div className="space-y-0.5 col-span-2 lg:col-span-1">
                            <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Invited By</label>
                            <p className="font-mono text-[10px] sm:text-xs text-[#00245D] bg-gray-100 p-1.5 sm:p-2 rounded truncate">{(userDetails.user as any).invitedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills Section with Pagination */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/30 overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-white/20 bg-gradient-to-r from-yellow-500/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-1.5 sm:gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm">💡</span>
                          Skills & Expertise
                          <span className="text-[10px] sm:text-xs font-normal text-[#00245D]/50">({userDetails.skills.length})</span>
                        </h3>
                        {/* Skills Pagination */}
                        {userDetails.skills.length > 6 && (
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <span className="text-[#00245D]/50 hidden sm:inline">Page:</span>
                            {Array.from({ length: Math.ceil(userDetails.skills.length / 6) }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => setModalSkillsPage(i + 1)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg font-medium transition-colors text-xs ${modalSkillsPage === i + 1
                                  ? 'bg-[#00245D] text-white'
                                  : 'bg-gray-100 text-[#00245D] hover:bg-gray-200'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        {userDetails.skills.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {userDetails.skills
                              .slice((modalSkillsPage - 1) * 6, modalSkillsPage * 6)
                              .map((skill, idx) => (
                                <div
                                  key={idx}
                                  className="group p-2.5 sm:p-3 md:p-4 bg-white/15 border border-white/25 rounded-lg sm:rounded-xl hover:bg-white/30 hover:border-white/40 hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-[#00245D] group-hover:text-[#003380] transition-colors break-words">{skill.skillName}</h4>
                                    <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${skill.willingnessLevel === 'pro_bono' ? 'bg-green-100 text-green-700' :
                                      skill.willingnessLevel === 'discount' ? 'bg-blue-100 text-blue-700' :
                                        skill.willingnessLevel === 'sponsor' ? 'bg-purple-100 text-purple-700' :
                                          skill.willingnessLevel === 'advice' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                      }`}>
                                      {skill.willingnessLevel.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-[#00245D]/50">{skill.category}</p>
                                  {skill.isHobby && (
                                    <span className="mt-1 sm:mt-2 inline-block text-[10px] sm:text-xs text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-0.5 rounded">🎨 Hobby</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-12 bg-white/10 rounded-lg sm:rounded-xl border border-white/20">
                            <div className="text-3xl sm:text-4xl mb-2">💡</div>
                            <p className="text-sm sm:text-base text-[#00245D]/50 font-medium">No skills listed yet</p>
                            <p className="text-xs sm:text-sm text-[#00245D]/30">User hasn&apos;t added any skills to their profile</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connections Section with Pagination */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/30 overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-white/20 bg-gradient-to-r from-[#99D6EA]/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-1.5 sm:gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#99D6EA]/30 rounded-lg flex items-center justify-center text-sm">🤝</span>
                          Connections & Network
                          <span className="text-[10px] sm:text-xs font-normal text-[#00245D]/50">({userDetails.connections.length})</span>
                        </h3>
                        {/* Connections Pagination */}
                        {userDetails.connections.length > 6 && (
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <span className="text-[#00245D]/50 hidden sm:inline">Page:</span>
                            {Array.from({ length: Math.ceil(userDetails.connections.length / 6) }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => setModalConnectionsPage(i + 1)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg font-medium transition-colors text-xs ${modalConnectionsPage === i + 1
                                  ? 'bg-[#00245D] text-white'
                                  : 'bg-gray-100 text-[#00245D] hover:bg-gray-200'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        {userDetails.connections.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {userDetails.connections
                              .slice((modalConnectionsPage - 1) * 6, modalConnectionsPage * 6)
                              .map((conn, idx) => (
                                <div
                                  key={idx}
                                  className="group p-2.5 sm:p-3 md:p-4 bg-white/15 border border-white/25 rounded-lg sm:rounded-xl hover:bg-white/30 hover:border-white/40 hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-[#00245D] group-hover:text-[#003380] transition-colors break-words">{conn.organizationName}</h4>
                                    <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${conn.relationshipStrength === 'decision_maker' ? 'bg-green-100 text-green-700' :
                                      conn.relationshipStrength === 'strong_contact' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                      {conn.relationshipStrength.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-[#00245D]/50 mb-1 sm:mb-2">{conn.sector}</p>
                                  {conn.contactName && (
                                    <p className="text-[10px] sm:text-xs text-[#00245D]/70 flex items-center gap-1">
                                      <span>👤</span> {conn.contactName}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-12 bg-white/10 rounded-lg sm:rounded-xl border border-white/20">
                            <div className="text-3xl sm:text-4xl mb-2">🤝</div>
                            <p className="text-sm sm:text-base text-[#00245D]/50 font-medium">No connections listed yet</p>
                            <p className="text-xs sm:text-sm text-[#00245D]/30">User hasn&apos;t added any connections to their profile</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-t border-white/20 bg-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                    <p className="text-[10px] sm:text-xs text-[#00245D]/40">
                      Last updated: {formatDateTime(userDetails.user.updatedAt)}
                    </p>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 bg-[#00245D] text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-[#003380] transition-colors shadow-lg shadow-[#00245D]/20"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 sm:p-16 text-center">
                  <div className="text-4xl sm:text-6xl mb-4">😞</div>
                  <p className="text-sm sm:text-lg text-[#00245D]/60 font-medium">User not found or failed to load.</p>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div >

      {/* Create/Edit Need Modal - Root Level Deployment */}
      <AdminNeedModal
        isOpen={isNeedModalOpen}
        onClose={() => { setIsNeedModalOpen(false); setEditingNeed(null); }}
        onSuccess={() => { setIsNeedModalOpen(false); setEditingNeed(null); fetchAllData(); }}
        needToEdit={editingNeed ?? undefined}
      />

      {/* Floating Skill Tooltip */}
      {
        skillTooltip.visible && (
          <div
            className="fixed z-[100] bg-white border border-[#D4C4A8] rounded-xl shadow-2xl p-4 animate-fadeIn max-w-xs pointer-events-none ring-1 ring-[#00245D]/5"
            style={{
              left: `${skillTooltip.x}px`,
              top: `${skillTooltip.y + 10}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-[10px] font-bold text-[#00245D]/40 mb-2 uppercase tracking-widest border-b border-[#D4C4A8]/20 pb-1">
              More Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillTooltip.skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-[#F0F7FA] text-[#00245D] rounded-md text-xs font-medium border border-[#99D6EA]/20 shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )
      }
    </ProtectedRoute >
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00245D] border-t-transparent"></div></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
