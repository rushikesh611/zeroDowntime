"use client"

import { useState, useEffect } from "react"
import { ContentLayout } from '@/components/dashboard/content-layout';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Bell, EllipsisIcon, Mail, Plus, Settings, Trash2Icon, Webhook, CheckCircle2, Send, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAppStore } from "@/store/useAppStore";
import { Notifier, NotifierType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Zod Schemas
const emailSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
})

const webhookSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    url: z.string().url({ message: "Invalid URL." }),
})

const NotificationCenter = () => {
    const { toast } = useToast()
    const { notifiers, fetchNotifiers, createNotifier, updateNotifier, deleteNotifier, testNotifier } = useAppStore()
    
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<NotifierType | null>(null)
    const [editingNotifierId, setEditingNotifierId] = useState<string | null>(null)

    useEffect(() => {
        fetchNotifiers();
    }, [fetchNotifiers]);

    // Forms
    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { name: "", email: "" },
    })

    const webhookForm = useForm<z.infer<typeof webhookSchema>>({
        resolver: zodResolver(webhookSchema),
        defaultValues: { name: "", url: "" },
    })

    const handleOpenSheet = (type: NotifierType, notifier?: Notifier) => {
        setSelectedType(type)
        setIsSheetOpen(true)
        if (notifier) {
            setEditingNotifierId(notifier.id)
            if (type === 'Email') emailForm.reset({ name: notifier.name, email: notifier.details })
            else webhookForm.reset({ name: notifier.name, url: notifier.details })
        } else {
            setEditingNotifierId(null)
            emailForm.reset({ name: "", email: "" })
            webhookForm.reset({ name: "", url: "" })
        }
    }

    const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
        try {
            if (editingNotifierId) {
                await updateNotifier(editingNotifierId, { name: values.name, details: values.email });
                toast({ title: "Notifier Updated", description: `${values.name} has been updated.` })
            } else {
                await createNotifier({ name: values.name, type: 'Email', details: values.email });
                toast({ title: "Notifier Created", description: `${values.name} has been added.` })
            }
            setIsSheetOpen(false)
        } catch (error) {
            toast({ title: "Error", description: "Failed to save notifier.", variant: "destructive" })
        }
    }

    const onWebhookSubmit = async (values: z.infer<typeof webhookSchema>) => {
        try {
            if (editingNotifierId) {
                await updateNotifier(editingNotifierId, { name: values.name, details: values.url });
                toast({ title: "Notifier Updated", description: `${values.name} has been updated.` })
            } else {
                await createNotifier({ name: values.name, type: 'Webhook', details: values.url });
                toast({ title: "Notifier Created", description: `${values.name} has been added.` })
            }
            setIsSheetOpen(false)
        } catch (error) {
            toast({ title: "Error", description: "Failed to save notifier.", variant: "destructive" })
        }
    }

    const handleTest = async (id: string, type: NotifierType) => {
        const result = await testNotifier(id);
        if (result.success) {
            toast({ title: "Test Sent", description: `A test notification has been sent.` })
        } else {
            toast({ title: "Test Failed", description: result.error || "Failed to send test.", variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteNotifier(id);
            toast({ title: "Notifier Deleted", variant: "destructive" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete notifier.", variant: "destructive" })
        }
    }

    return (
        <ContentLayout>
            <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-5xl mx-auto py-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
                    <p className="text-muted-foreground text-sm">Manage your alerting channels and notification preferences.</p>
                </div>

                {/* Setup Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        className="border border-border bg-card rounded-lg p-5 flex items-center gap-4 hover:border-border/80 transition-colors group cursor-pointer" 
                        onClick={() => handleOpenSheet('Email')}
                    >
                        <div className="h-10 w-10 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-sm font-semibold text-foreground">Email Alerts</h3>
                            <p className="text-xs text-muted-foreground">Get downtime notifications in your inbox.</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div 
                        className="border border-border bg-card rounded-lg p-5 flex items-center gap-4 hover:border-border/80 transition-colors group cursor-pointer" 
                        onClick={() => handleOpenSheet('Webhook')}
                    >
                        <div className="h-10 w-10 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                            <Webhook className="h-5 w-5" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-sm font-semibold text-foreground">Webhook Integration</h3>
                            <p className="text-xs text-muted-foreground">Send POST requests to your own API or Slack.</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Configured Channels */}
                <div className="space-y-0">
                    <div className="flex flex-col gap-1.5 bg-muted/20 border-t border-x border-border/80 px-5 py-4 rounded-t-lg mt-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Configured Channels</span>
                        <span className="text-xs text-muted-foreground">Channels currently being used for monitoring alerts.</span>
                    </div>

                    <div className="border-b border-x border-border/80 rounded-b-lg bg-card overflow-hidden">
                        {notifiers.length === 0 ? (
                            <div className="py-16 text-center max-w-sm mx-auto">
                                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 border">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No channels configured</h3>
                                <p className="text-xs text-muted-foreground mt-1">Start by adding an email or webhook alert channel above.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-foreground">Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-foreground">Type</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-foreground">Details</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right pr-6 text-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notifiers.map((notifier) => (
                                        <TableRow key={notifier.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`h-7 w-7 rounded-md border flex items-center justify-center text-[10px] ${notifier.type === 'Email' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                                        {notifier.type === 'Email' ? <Mail className="h-3.5 w-3.5" /> : <Webhook className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground">{notifier.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <Badge variant="secondary" className="text-[10px] h-5 rounded-md">{notifier.type}</Badge>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded border">{notifier.details}</span>
                                            </TableCell>
                                            <TableCell className="py-3.5 text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <EllipsisIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleOpenSheet(notifier.type, notifier)}>
                                                            <Settings className="h-3.5 w-3.5 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTest(notifier.id, notifier.type)}>
                                                            <Send className="h-3.5 w-3.5 mr-2" /> Test
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(notifier.id)}>
                                                            <Trash2Icon className="h-3.5 w-3.5 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>

            {/* Creation / Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[480px] border-l sm:max-w-md p-6">
                    <SheetHeader className="space-y-1 mb-8">
                        <SheetTitle className="text-xl tracking-tight">{editingNotifierId ? 'Edit' : 'Add'} {selectedType} Channel</SheetTitle>
                        <SheetDescription className="text-xs">Configure where you want to receive downtime alerts.</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6">
                        {selectedType === 'Email' && (
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={emailForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground">Display Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Engineering Team" className="h-10 text-sm bg-background" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={emailForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground">Email Address</FormLabel>
                                                    <FormControl><Input placeholder="alerts@company.com" className="h-10 text-sm bg-background" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Button type="submit" className="w-full h-10 font-bold">{editingNotifierId ? 'Update' : 'Add'} Channel</Button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {selectedType === 'Webhook' && (
                            <Form {...webhookForm}>
                                <form onSubmit={webhookForm.handleSubmit(onWebhookSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={webhookForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground">Display Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Slack Webhook" className="h-10 text-sm bg-background" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={webhookForm.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground">Webhook URL</FormLabel>
                                                    <FormControl><Input placeholder="https://hooks.slack.com/services/..." className="h-10 text-sm bg-background" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    <div className="p-4 bg-muted/30 rounded-md border">
                                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                            <InfoIcon className="h-3.5 w-3.5" /> Payload format
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            We'll send a JSON POST request containing the monitor name, status, and downtime duration when an event occurs.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                        <Button type="submit" className="w-full h-10 font-bold">{editingNotifierId ? 'Update' : 'Add'} Webhook</Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </ContentLayout>
    )
}

const InfoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
)

export default NotificationCenter