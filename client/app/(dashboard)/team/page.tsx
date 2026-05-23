'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { useAppStore } from '@/store/useAppStore';
import { Users, Plus, Shield, ShieldAlert, Trash2, Check, Monitor as MonitorIcon, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

    if (loading) return (
        <ContentLayout>
            <div className="space-y-8 max-w-5xl mx-auto py-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>

                {/* Members card skeleton */}
                <div className="border rounded-lg">
                    <div className="p-6 border-b flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-56" />
                        </div>
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Invite form skeleton */}
                        <div className="flex gap-3 mb-6">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-[140px]" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                        {/* Member rows skeleton */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3.5 w-28" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-[110px]" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared monitors card skeleton */}
                <div className="border rounded-lg">
                    <div className="p-6 border-b space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <div className="p-6">
                        <div className="grid gap-2 sm:grid-cols-2">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-16 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );

    // Only show Team management if user is PRO or PRO_PLUS, OR if they are a member of a team
    const hasAccess = user?.plan === 'PRO' || user?.plan === 'PRO_PLUS' || (teamData && teamData.memberTeams?.length > 0);

    if (!hasAccess) {
        return (
            <ContentLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="p-4 rounded-full bg-muted">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Team Features Unavailable</h2>
                    <p className="text-sm text-muted-foreground max-w-sm text-center">
                        You need a Pro or Pro Plus subscription to create a team and invite members.
                    </p>
                    <a href="/billing" className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm">
                        Upgrade Plan
                    </a>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout>
            <div className="space-y-8 max-w-5xl mx-auto py-6 animate-in fade-in-50 duration-500">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team Management</h1>
                    <p className="text-sm text-muted-foreground">Manage your team members and their access to your monitors.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                        {error}
                    </div>
                )}

                {/* Team Admin View */}
                {teamData?.ownedTeam && (
                    <div className="space-y-6">
                        {/* Members Section */}
                        <div className="border border-border bg-card rounded-lg overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                        <Shield className="w-4 h-4 text-muted-foreground" />
                                        Your Team Members
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Invite colleagues and manage their roles.</p>
                                </div>
                                <Badge variant="secondary" className="text-[10px] bg-muted border font-bold uppercase tracking-wider rounded-md h-5">
                                    {teamData.ownedTeam.members.length} / {user?.plan === 'PRO' ? 20 : 50} Members
                                </Badge>
                            </div>
                            
                            <div className="p-5 space-y-6">
                                {/* Invite Form */}
                                <form onSubmit={handleInvite} className="flex gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Colleague's email address"
                                        required
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        className="h-10 text-sm flex-grow"
                                    />
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger className="w-[140px] h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="READ">Read Only</SelectItem>
                                            <SelectItem value="WRITE">Read & Write</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="submit"
                                        disabled={inviting}
                                        className="h-10 px-6 font-semibold"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {inviting ? 'Inviting...' : 'Invite'}
                                    </Button>
                                </form>

                                {/* Member List */}
                                <div className="space-y-2.5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Active Members</div>
                                    {teamData.ownedTeam.members.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/10 hover:border-border/80 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-muted border flex items-center justify-center font-bold text-muted-foreground text-xs uppercase">
                                                    {member.user.username.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm leading-none text-foreground">{member.user.username}</div>
                                                    <div className="text-xs text-muted-foreground mt-1.5">{member.user.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                                                    <SelectTrigger className="h-8 w-[110px] text-xs bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="READ" className="text-xs">Read Only</SelectItem>
                                                        <SelectItem value="WRITE" className="text-xs">Write</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleRemove(member.id)}
                                                    className="h-8 w-8 text-rose-500 hover:text-white hover:bg-rose-500 hover:border-rose-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {teamData.ownedTeam.members.length === 0 && (
                                        <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                            No members in your team yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monitor Sharing Section */}
                        <div className="border border-border bg-card rounded-lg overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-border/80 bg-muted/20">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <MonitorIcon className="w-4 h-4 text-muted-foreground" />
                                    Shared Monitors
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Select which monitors you want to share with your team members.</p>
                            </div>
                            <div className="p-5">
                                {monitors.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                        You don't have any monitors to share. <a href="/monitors/create" className="text-primary hover:underline">Create one</a>.
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {monitors.map(monitor => {
                                            const isShared = teamData.ownedTeam.monitors.some((m: any) => m.monitorId === monitor.id);
                                            return (
                                                <label
                                                    key={monitor.id}
                                                    className={`flex items-center justify-between p-3.5 rounded-lg cursor-pointer transition-all border ${isShared ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-muted/10 border-border hover:border-border/80'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-8 h-8 rounded-md border shrink-0 flex items-center justify-center ${isShared ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                            <Globe className="w-4 h-4" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <div className="font-semibold text-sm truncate leading-none text-foreground">{monitor.name || monitor.url}</div>
                                                            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-2">{monitor.type || 'HTTP'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isShared} 
                                                            onChange={() => toggleMonitorShare(monitor.id, isShared)}
                                                            className="sr-only"
                                                        />
                                                        {isShared ? (
                                                            <div className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center shrink-0">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 rounded border border-input shrink-0 bg-background" />
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Member Teams View */}
                {teamData?.memberTeams?.length > 0 && (
                    <div className="space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Teams you belong to</div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {teamData.memberTeams.map((team: any) => (
                                <Card key={team.id} className="shadow-none border">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3 mb-5">
                                            <div className="p-2.5 rounded bg-primary/10">
                                                <ShieldAlert className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm truncate leading-none">{team.admin.username}'s Team</div>
                                                <div className="text-xs text-muted-foreground truncate mt-1.5 mb-2.5">Admin: {team.admin.email}</div>
                                                <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider h-5 ${team.role === 'WRITE' ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground'}`}>
                                                    Role: {team.role}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shared with you</div>
                                            <div className="space-y-1.5">
                                                {team.monitors.map((monitor: any) => (
                                                    <div key={monitor.id} className="flex items-center gap-2 p-2 rounded bg-muted/40 border border-transparent">
                                                        <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                                                        <span className="text-xs font-medium truncate">{monitor.name || monitor.url}</span>
                                                    </div>
                                                ))}
                                                {team.monitors.length === 0 && (
                                                    <div className="text-xs text-muted-foreground italic">No monitors shared with this team yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
}
