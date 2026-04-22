'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { useAppStore } from '@/store/useAppStore';
import { Users, Plus, Shield, ShieldAlert, Trash2, Edit2, Check, Monitor as MonitorIcon, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/utils';

export default function TeamPage() {
    const { user } = useAppStore();
    const [teamData, setTeamData] = useState<any>(null);
    const [monitors, setMonitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('READ');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        if (teamData?.ownedTeam) {
            fetchOwnedMonitors();
        }
    }, [teamData?.ownedTeam?.id]);

    const fetchTeam = async () => {
        try {
            const res = await fetchWithAuth('/api/teams');
            const data = await res.json();
            setTeamData(data);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOwnedMonitors = async () => {
        try {
            const res = await fetchWithAuth('/api/monitors');
            const data = await res.json();
            // Only monitors where role === 'OWNER'
            setMonitors(data.filter((m: any) => m.role === 'OWNER'));
        } catch (err) {
            console.error('Failed to fetch monitors for sharing:', err);
        }
    };

    const toggleMonitorShare = async (monitorId: string, currentlyShared: boolean) => {
        try {
            if (currentlyShared) {
                await fetchWithAuth(`/api/teams/monitors/${monitorId}`, { method: 'DELETE' });
            } else {
                await fetchWithAuth('/api/teams/monitors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monitorId })
                });
            }
            fetchTeam(); // Refresh shared state to update UI
        } catch (err) {
            console.error('Failed to toggle monitor share:', err);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setError(null);
        try {
            const res = await fetchWithAuth('/api/teams/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setInviteEmail('');
            fetchTeam();
        } catch (err: any) {
            setError(err.message || 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await fetchWithAuth(`/api/teams/members/${memberId}`, { method: 'DELETE' });
            fetchTeam();
        } catch (err) {
            console.error('Failed to remove member:', err);
        }
    };

    const handleRoleChange = async (memberId: string, role: string) => {
        try {
            await fetchWithAuth(`/api/teams/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            fetchTeam();
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    if (loading) return null;

    // Only show Team management if user is PRO or PRO_PLUS, OR if they are a member of a team
    const hasAccess = user?.plan === 'PRO' || user?.plan === 'PRO_PLUS' || (teamData && teamData.memberTeams?.length > 0);

    if (!hasAccess) {
        return (
            <ContentLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="p-4 rounded-full bg-secondary/10">
                        <Users className="w-8 h-8 text-secondary" />
                    </div>
                    <h2 className="text-xl font-bold">Team Features Unavailable</h2>
                    <p className="text-sm text-on-surface-variant max-w-sm text-center">
                        You need a Pro or Pro Plus subscription to create a team and invite members.
                    </p>
                    <a href="/billing" className="px-6 py-2 rounded-xl bg-secondary text-on-secondary font-semibold">
                        Upgrade Plan
                    </a>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout>
            <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in-50 duration-500">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Team Management</h1>
                    <p className="text-sm text-on-surface-variant">Manage your team members and their access to your monitors.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Team Admin View */}
                {teamData?.ownedTeam && (
                    <div className="space-y-6">
                        {/* Members Section */}
                        <div className="p-6 rounded-3xl border border-surface-container-high bg-surface-container-lowest shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Your Team Members
                                </h3>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-container-high">
                                    {teamData.ownedTeam.members.length} / {user?.plan === 'PRO' ? 20 : 50} Members
                                </span>
                            </div>

                            {/* Invite Form */}
                            <form onSubmit={handleInvite} className="flex gap-4 mb-8">
                                <input
                                    type="email"
                                    placeholder="Colleague's email address"
                                    required
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-container-high bg-surface-container text-sm outline-none focus:border-primary"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-surface-container-high bg-surface-container text-sm outline-none focus:border-primary"
                                >
                                    <option value="READ">Read Only</option>
                                    <option value="WRITE">Read & Write</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {inviting ? 'Inviting...' : 'Invite'}
                                </button>
                            </form>

                            {/* Member List */}
                            <div className="space-y-4">
                                {teamData.ownedTeam.members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant">
                                                {member.user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{member.user.username}</div>
                                                <div className="text-xs text-on-surface-variant">{member.user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={member.role}
                                                onChange={e => handleRoleChange(member.id, e.target.value)}
                                                className="px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs font-semibold outline-none"
                                            >
                                                <option value="READ">Read Only</option>
                                                <option value="WRITE">Write</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {teamData.ownedTeam.members.length === 0 && (
                                    <div className="text-center py-8 text-sm text-on-surface-variant font-medium">
                                        No members in your team yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monitor Sharing Section */}
                        <div className="p-6 rounded-3xl border border-surface-container-high bg-surface-container-lowest shadow-sm">
                            <div className="space-y-1 mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MonitorIcon className="w-5 h-5 text-primary" />
                                    Shared Monitors
                                </h3>
                                <p className="text-xs text-on-surface-variant">Select which monitors you want to share with your team members.</p>
                            </div>

                            {monitors.length === 0 ? (
                                <div className="text-center py-8 text-sm text-on-surface-variant font-medium">
                                    You don't have any monitors to share. <a href="/monitors/create" className="text-primary hover:underline">Create one</a>.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {monitors.map(monitor => {
                                        const isShared = teamData.ownedTeam.monitors.some((m: any) => m.monitorId === monitor.id);
                                        return (
                                            <div
                                                key={monitor.id}
                                                onClick={() => toggleMonitorShare(monitor.id, isShared)}
                                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isShared ? 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/5' : 'bg-surface-container border-transparent hover:border-surface-container-high'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isShared ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-semibold text-sm truncate">{monitor.name || monitor.url}</div>
                                                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">{monitor.url ? 'HTTP' : 'TCP'}</div>
                                                    </div>
                                                </div>
                                                {isShared ? (
                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-on-primary" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-surface-container-high shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Member Teams View */}
                {teamData?.memberTeams?.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold">Teams you belong to</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {teamData.memberTeams.map((team: any) => (
                                <div key={team.id} className="p-6 rounded-3xl border border-surface-container-high bg-surface-container shadow-sm">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-3 rounded-full bg-primary/10">
                                            <ShieldAlert className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-base mb-1">{team.admin.username}'s Team</div>
                                            <div className="text-xs text-on-surface-variant mb-3">Admin: {team.admin.email}</div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${team.role === 'WRITE' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                                Role: {team.role}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Shared with you</div>
                                        <div className="space-y-1.5">
                                            {team.monitors.map((monitor: any) => (
                                                <div key={monitor.id} className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/50">
                                                    <Globe className="w-3.5 h-3.5 text-primary" />
                                                    <span className="text-sm font-medium text-on-surface truncate">{monitor.name || monitor.url}</span>
                                                </div>
                                            ))}
                                            {team.monitors.length === 0 && (
                                                <div className="text-xs text-on-surface-variant italic px-1">No monitors shared with this team yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
}
