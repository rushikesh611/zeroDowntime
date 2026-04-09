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

// Zod Schemas
const emailSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
})

const webhookSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    url: z.string().url({ message: "Invalid URL." }),
})

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">{children}</p>
)

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
        defaultValues: {
            name: "",
            email: "",
        },
    })

    const webhookForm = useForm<z.infer<typeof webhookSchema>>({
        resolver: zodResolver(webhookSchema),
        defaultValues: {
            name: "",
            url: "",
        },
    })

    const handleOpenSheet = (type: NotifierType, notifier?: Notifier) => {
        setSelectedType(type)
        setIsSheetOpen(true)
        if (notifier) {
            setEditingNotifierId(notifier.id)
            if (type === 'Email') {
                emailForm.reset({ name: notifier.name, email: notifier.details })
            } else {
                webhookForm.reset({ name: notifier.name, url: notifier.details })
            }
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
                toast({
                    title: "Notifier Updated",
                    description: `${values.name} has been updated.`,
                })
            } else {
                await createNotifier({
                    name: values.name,
                    type: 'Email',
                    details: values.email,
                });
                toast({
                    title: "Notifier Created",
                    description: `${values.name} has been added to your notifiers.`,
                })
            }
            setIsSheetOpen(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save notifier. Please try again.",
                variant: "destructive"
            })
        }
    }

    const onWebhookSubmit = async (values: z.infer<typeof webhookSchema>) => {
        try {
            if (editingNotifierId) {
                await updateNotifier(editingNotifierId, { name: values.name, details: values.url });
                toast({
                    title: "Notifier Updated",
                    description: `${values.name} has been updated.`,
                })
            } else {
                await createNotifier({
                    name: values.name,
                    type: 'Webhook',
                    details: values.url,
                });
                toast({
                    title: "Notifier Created",
                    description: `${values.name} has been added to your notifiers.`,
                })
            }
            setIsSheetOpen(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save notifier. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleTest = async (id: string, type: NotifierType) => {
        const result = await testNotifier(id);
        if (result.success) {
            toast({
                title: "Test Sent",
                description: `A test notification has been sent to the provided ${type === 'Email' ? 'email' : 'URL'}.`,
            })
        } else {
            toast({
                title: "Test Failed",
                description: result.error || "Failed to send test notification.",
                variant: "destructive"
            })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteNotifier(id);
            toast({
                title: "Notifier Deleted",
                description: "The notifier has been removed.",
                variant: "destructive"
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete notifier.",
                variant: "destructive"
            })
        }
    }

    // Watch form values for disabled button state
    const watchedEmailName = emailForm.watch('name');
    const watchedEmailAddr = emailForm.watch('email');
    const watchedWebhookName = webhookForm.watch('name');
    const watchedWebhookUrl = webhookForm.watch('url');

    const isEmailFormReady = watchedEmailName?.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmailAddr || '');
    const isWebhookFormReady = watchedWebhookName?.length >= 2 && /^https?:\/\/.+/.test(watchedWebhookUrl || '');

    return (
        <ContentLayout>
            <div className="space-y-5 animate-in fade-in-50 duration-500">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-semibold tracking-tight text-on-surface">
                            Notifications
                        </h1>
                        <p className="text-on-surface-variant text-sm">
                            Define your notification channels for downtime alerts.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Total Channels</span>
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bell className="h-3.5 w-3.5 text-primary" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-on-surface tracking-tight">{notifiers.length}</div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">All configured channels</p>
                    </div>

                    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Email</span>
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <Mail className="h-3.5 w-3.5 text-secondary" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-secondary tracking-tight">
                            {notifiers.filter(n => n.type === 'Email').length}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">Email notifiers</p>
                    </div>

                    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Webhook</span>
                            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                                <Webhook className="h-3.5 w-3.5 text-tertiary" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-tertiary tracking-tight">
                            {notifiers.filter(n => n.type === 'Webhook').length}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">Webhook notifiers</p>
                    </div>
                </div>

                {/* Notifiers List */}
                <div className="bg-surface-container rounded-xl p-1.5">
                    {notifiers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-on-surface mb-1.5">No notifiers yet</h3>
                            <p className="text-sm text-on-surface-variant mb-6 max-w-sm leading-relaxed">
                                Create an email or webhook notifier to start receiving downtime alerts.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                                <div className="col-span-4">Name</div>
                                <div className="col-span-2">Provider</div>
                                <div className="col-span-5">Details</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>

                            {/* Notifier Rows */}
                            {notifiers.map((notifier) => (
                                <div
                                    key={notifier.id}
                                    className="grid grid-cols-12 items-center px-4 py-3 bg-surface-container-lowest rounded-xl hover:bg-white hover:shadow-sm transition-all duration-150 group"
                                >
                                    {/* Name */}
                                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            notifier.type === 'Email'
                                                ? 'bg-secondary/10'
                                                : 'bg-tertiary/10'
                                        }`}>
                                            {notifier.type === 'Email' ? (
                                                <Mail className="h-3.5 w-3.5 text-secondary" />
                                            ) : (
                                                <Webhook className="h-3.5 w-3.5 text-tertiary" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-sm text-on-surface truncate">{notifier.name}</span>
                                    </div>

                                    {/* Provider */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            notifier.type === 'Email'
                                                ? 'bg-secondary/10 text-secondary'
                                                : 'bg-tertiary/10 text-tertiary'
                                        }`}>
                                            {notifier.type}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="col-span-5 min-w-0">
                                        <span className="text-sm text-on-surface-variant truncate block font-medium">{notifier.details}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors opacity-0 group-hover:opacity-100">
                                                    <EllipsisIcon className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="min-w-[160px]">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem
                                                        className="rounded-lg text-sm font-medium cursor-pointer"
                                                        onClick={() => handleOpenSheet(notifier.type, notifier)}
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="rounded-lg text-sm font-medium cursor-pointer text-error focus:text-error"
                                                        onClick={() => handleDelete(notifier.id)}
                                                    >
                                                        <Trash2Icon className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Notifier Section */}
                <div className="space-y-0.5">
                    <h2 className="text-base font-semibold text-on-surface tracking-tight">Create a new notifier</h2>
                    <p className="text-sm text-on-surface-variant">Select the type of notification channel to add.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Email Card */}
                    <button
                        onClick={() => handleOpenSheet('Email')}
                        className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:bg-white cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Mail className="h-4.5 w-4.5 text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-on-surface">Email</h3>
                                    <Plus className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                    Receive alert notifications directly to an email address when downtime is detected.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Webhook Card */}
                    <button
                        onClick={() => handleOpenSheet('Webhook')}
                        className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 text-left group hover:bg-white cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary/15 to-tertiary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Webhook className="h-4.5 w-4.5 text-tertiary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-on-surface">Webhook</h3>
                                    <Plus className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                    Trigger a POST request to a custom URL endpoint with alert payload data.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Creation / Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[480px] bg-surface-container-lowest border-l-0 shadow-2xl shadow-primary/5">
                    <SheetHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                selectedType === 'Email'
                                    ? 'bg-gradient-to-br from-secondary/15 to-secondary/5'
                                    : 'bg-gradient-to-br from-tertiary/15 to-tertiary/5'
                            }`}>
                                {selectedType === 'Email' ? (
                                    <Mail className="h-4 w-4 text-secondary" />
                                ) : (
                                    <Webhook className="h-4 w-4 text-tertiary" />
                                )}
                            </div>
                            <div>
                                <SheetTitle className="text-base font-semibold text-on-surface">
                                    {editingNotifierId ? 'Edit' : 'Create'} {selectedType} Notifier
                                </SheetTitle>
                                <SheetDescription className="text-xs text-on-surface-variant mt-0">
                                    {editingNotifierId ? 'Update the details of your' : 'Add a new'} {selectedType?.toLowerCase()} notification channel.
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {selectedType === 'Email' && (
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                                    <div className="bg-surface-container rounded-2xl p-5 space-y-4">
                                        <SectionLabel>Configuration</SectionLabel>
                                        <FormField
                                            control={emailForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-on-surface-variant">Display Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Production Alerts"
                                                            className="bg-surface-container-lowest border-none rounded-xl h-11 font-medium focus:bg-white transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={emailForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-on-surface-variant">Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="alerts@example.com"
                                                            className="bg-surface-container-lowest border-none rounded-xl h-11 font-medium focus:bg-white transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => editingNotifierId && handleTest(editingNotifierId, 'Email')}
                                            disabled={!editingNotifierId}
                                            className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Send Test
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!isEmailFormReady}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[0.99] active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {editingNotifierId ? 'Update' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {selectedType === 'Webhook' && (
                            <Form {...webhookForm}>
                                <form onSubmit={webhookForm.handleSubmit(onWebhookSubmit)} className="space-y-5">
                                    <div className="bg-surface-container rounded-2xl p-5 space-y-4">
                                        <SectionLabel>Configuration</SectionLabel>
                                        <FormField
                                            control={webhookForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-on-surface-variant">Display Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Slack Webhook"
                                                            className="bg-surface-container-lowest border-none rounded-xl h-11 font-medium focus:bg-white transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={webhookForm.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-on-surface-variant">Webhook URL</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://hooks.slack.com/services/..."
                                                            className="bg-surface-container-lowest border-none rounded-xl h-11 font-medium focus:bg-white transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Info box */}
                                    <div className="flex items-start gap-3 p-4 bg-tertiary/5 rounded-xl">
                                        <AlertTriangle className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                            The webhook will receive a POST request with a JSON payload containing alert details whenever a monitor goes down or recovers.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => editingNotifierId && handleTest(editingNotifierId, 'Webhook')}
                                            disabled={!editingNotifierId}
                                            className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Send Test
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!isWebhookFormReady}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[0.99] active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {editingNotifierId ? 'Update' : 'Save'}
                                        </button>
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

export default NotificationCenter