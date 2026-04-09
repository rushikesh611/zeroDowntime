"use client"

import { ContentLayout } from "@/components/dashboard/content-layout"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { fetchWithAuth, parseTcpHost } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { IE, IN, US } from "country-flag-icons/react/3x2"
import { ArrowLeft, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

const assertionSchema = z.object({
    id: z.string(),
    type: z.enum(['status', 'header', 'body']),
    condition: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'matches', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual']),
    property: z.string().optional(),
    value: z.string()
})

const headerSchema = z.object({
    key: z.string(),
    value: z.string()
})

const formSchema = z.object({
    monitorType: z.enum(['http', 'tcp']),
    url: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
    headers: z.array(headerSchema),
    assertions: z.array(assertionSchema),
    tcpHost: z.string().optional(),
    emails: z.array(z.string().email()),
    frequency: z.coerce.number().min(1, 'Frequency is required'),
    regions: z.array(z.string()).min(1, 'At least one region is required')
}).superRefine((data, ctx) => {
    if (data.monitorType === 'http') {
        if (!data.url) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "URL is required",
                path: ["url"]
            });
        } else {
            try {
                z.string().url().parse(data.url);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid URL",
                    path: ["url"]
                });
            }
        }
    } else if (data.monitorType === 'tcp') {
        if (!data.tcpHost) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "TCP Host is required",
                path: ["tcpHost"]
            });
        } else if (!/^(.*):(\\d+)$/.test(data.tcpHost)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid TCP Host format. Expected host:port",
                path: ["tcpHost"]
            });
        }
    }

    if (data.emails.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one email is required",
            path: ["emails"]
        });
    }
});

type FormValues = z.infer<typeof formSchema>

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">{children}</p>
)

const UpdateMonitorPage = () => {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [emailInput, setEmailInput] = useState('')
    const [initialMonitorType, setInitialMonitorType] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            monitorType: 'http',
            method: 'GET',
            url: '',
            tcpHost: '',
            emails: [],
            regions: [],
            headers: [],
            assertions: [],
        }
    })

    const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({
        control: form.control,
        name: "headers"
    })

    const { fields: assertionFields, append: appendAssertion, remove: removeAssertion } = useFieldArray({
        control: form.control,
        name: "assertions"
    })

    useEffect(() => {
        const fetchMonitorData = async () => {
            try {
                const response = await fetchWithAuth(`/api/monitors/${id}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch monitor data')
                }
                const data = await response.json()

                // Prepare default values
                const type = data.monitorType || data.type || 'http';
                setInitialMonitorType(type)
                let tcpHost = '';
                if (type === 'tcp') {
                    tcpHost = `${data.host}:${data.port}`;
                }

                let assertions: any[] = [];
                if (data.assertions && Array.isArray(data.assertions)) {
                    assertions = data.assertions.map((a: any, index: number) => ({
                        ...a,
                        id: a.id || `${Date.now()}-${index}`
                    }))
                }

                let headers: { key: string; value: string }[] = [];
                if (data.headers && typeof data.headers === 'object') {
                    headers = Object.entries(data.headers).map(([key, value]) => ({
                        key,
                        value: value as string
                    }));
                }

                form.reset({
                    monitorType: type,
                    method: data.method || 'GET',
                    url: data.url || '',
                    tcpHost,
                    emails: data.emails || [],
                    regions: data.regions || [],
                    headers: headers,
                    assertions: assertions,
                    frequency: data.frequency
                });

                setLoading(false)
            } catch (error) {
                console.error('Error fetching monitor data:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load monitor data',
                    variant: 'destructive'
                })
                setLoading(false)
            }
        }

        fetchMonitorData()
    }, [id, form])

    const handleAddEmail = () => {
        if (emailInput) {
            // Simple email validation for the input
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput)) {
                toast({
                    title: "Invalid Email",
                    description: "Please enter a valid email address",
                    variant: "destructive"
                });
                return;
            }

            const currentEmails = form.getValues('emails');
            if (!currentEmails.includes(emailInput)) {
                form.setValue('emails', [...currentEmails, emailInput], { shouldValidate: true });
                setEmailInput('');
            }
        }
    }

    const handleRemoveEmail = (email: string) => {
        const currentEmails = form.getValues('emails');
        form.setValue('emails', currentEmails.filter(e => e !== email), { shouldValidate: true });
    }

    const onSubmit = async (data: FormValues) => {
        const payload = {
            monitorType: data.monitorType,
            ...(data.monitorType === 'http' ? {
                method: data.method,
                url: data.url,
                headers: data.headers.filter(h => h.key && h.value).reduce((acc, h) => {
                    acc[h.key] = h.value;
                    return acc;
                }, {} as Record<string, string>),
                body: null,
                assertions: data.assertions,
            } : {
                host: parseTcpHost(data.tcpHost!).host,
                port: parseTcpHost(data.tcpHost!).port
            }),
            emails: data.emails,
            frequency: data.frequency,
            regions: data.regions
        }

        try {
            const response = await fetchWithAuth(`/api/monitors/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            if (!response.ok) {
                throw new Error('Failed to update monitor')
            }
            const result = await response.json()
            toast({
                title: 'Success',
                description: `Monitor updated successfully`,
            })
            router.push(`/monitors/${id}`)
        } catch (error) {
            console.error('Error updating monitor:', error)
            toast({
                title: 'Error',
                description: 'Failed to update monitor',
                variant: 'destructive'
            })
        }
    }

    if (loading) {
        return (
            <ContentLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </ContentLayout>
        )
    }

    const monitorType = form.watch('monitorType');
    const watchedUrl = form.watch('url');
    const watchedTcpHost = form.watch('tcpHost');
    const watchedEmails = form.watch('emails');
    const watchedFrequency = form.watch('frequency');
    const watchedRegions = form.watch('regions');

    const isFormReady = (() => {
        if (monitorType === 'http' && !watchedUrl) return false;
        if (monitorType === 'tcp' && !watchedTcpHost) return false;
        if (!watchedEmails || watchedEmails.length === 0) return false;
        if (!watchedFrequency || watchedFrequency < 1) return false;
        if (!watchedRegions || watchedRegions.length === 0) return false;
        return true;
    })();

    return (
        <ContentLayout>
            <div className="mx-auto max-w-2xl py-2">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Monitor
                    </button>
                    <h1 className="text-xl font-semibold tracking-tight text-on-surface mb-1">Update Monitor</h1>
                    <p className="text-sm text-on-surface-variant">Modify monitoring settings for your endpoint.</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Monitor Type */}
                        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                            <SectionLabel>Monitor Type</SectionLabel>
                            <FormField
                                control={form.control}
                                name="monitorType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(['http', 'tcp'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => field.onChange(type)}
                                                        disabled={(type === 'http' && initialMonitorType === 'tcp') || (type === 'tcp' && initialMonitorType === 'http')}
                                                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            field.value === type
                                                                ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-md shadow-primary/20'
                                                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                                                        }`}
                                                    >
                                                        {type.toUpperCase()}
                                                        <span className="block text-xs font-medium opacity-75 mt-0.5">
                                                            {type === 'http' ? 'Web endpoints' : 'TCP connections'}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* HTTP Configuration */}
                        {monitorType === 'http' && (
                            <>
                                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-6">
                                    <SectionLabel>Endpoint</SectionLabel>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="col-span-1">
                                            <FormField
                                                control={form.control}
                                                name="method"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold text-on-surface-variant">Method</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-surface-container border-none rounded-xl h-11 font-semibold">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((method) => (
                                                                    <SelectItem key={method} value={method} className="rounded-lg">{method}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="url"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold text-on-surface-variant">URL</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://api.example.com/health"
                                                                className="bg-surface-container border-none rounded-xl h-11 font-medium focus:bg-surface-container-high transition-colors"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Request Headers */}
                                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <SectionLabel>Request Headers</SectionLabel>
                                        <button
                                            type="button"
                                            onClick={() => appendHeader({ key: '', value: '' })}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dim transition-colors"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Add Header
                                        </button>
                                    </div>
                                    {headerFields.length > 0 ? (
                                        <div className="space-y-2">
                                            {headerFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 items-start">
                                                    <FormField control={form.control} name={`headers.${index}.key`} render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="Key" className="bg-surface-container border-none rounded-xl h-10 text-sm" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`headers.${index}.value`} render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="Value" className="bg-surface-container border-none rounded-xl h-10 text-sm" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <button type="button" onClick={() => removeHeader(index)} className="mt-1 h-10 w-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant font-medium py-2">No headers added yet.</p>
                                    )}
                                </div>

                                {/* Assertions */}
                                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <SectionLabel>Assertions</SectionLabel>
                                        <button
                                            type="button"
                                            onClick={() => appendAssertion({ id: Date.now().toString(), type: 'status', condition: 'equals', value: '' })}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dim transition-colors"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Add Assertion
                                        </button>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mb-4 font-medium leading-relaxed">
                                        Validate the response to ensure your service is working as expected.
                                    </p>
                                    {assertionFields.length > 0 ? (
                                        <div className="space-y-3">
                                            {assertionFields.map((field, index) => {
                                                const type = form.watch(`assertions.${index}.type`);
                                                return (
                                                    <div key={field.id} className="bg-surface-container rounded-2xl p-4 space-y-3">
                                                        <div className="flex gap-2 items-start">
                                                            <FormField control={form.control} name={`assertions.${index}.type`} render={({ field }) => (
                                                                <FormItem>
                                                                    <Select onValueChange={(val) => { field.onChange(val); if (val === 'status' || val === 'body') { form.setValue(`assertions.${index}.property`, undefined); } }} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-[110px] bg-surface-container-lowest border-none rounded-xl h-10 text-sm font-semibold">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="status" className="rounded-lg">Status</SelectItem>
                                                                            <SelectItem value="header" className="rounded-lg">Header</SelectItem>
                                                                            <SelectItem value="body" className="rounded-lg">Body</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name={`assertions.${index}.condition`} render={({ field }) => (
                                                                <FormItem className="flex-1">
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="bg-surface-container-lowest border-none rounded-xl h-10 text-sm font-semibold">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {type === 'status' ? (
                                                                                <>
                                                                                    <SelectItem value="equals" className="rounded-lg">Equals</SelectItem>
                                                                                    <SelectItem value="notEquals" className="rounded-lg">Not Equals</SelectItem>
                                                                                    <SelectItem value="greaterThan" className="rounded-lg">Greater Than</SelectItem>
                                                                                    <SelectItem value="lessThan" className="rounded-lg">Less Than</SelectItem>
                                                                                    <SelectItem value="greaterThanOrEqual" className="rounded-lg">Greater Than or Equal</SelectItem>
                                                                                    <SelectItem value="lessThanOrEqual" className="rounded-lg">Less Than or Equal</SelectItem>
                                                                                </>
                                                                            ) : type === 'header' ? (
                                                                                <>
                                                                                    <SelectItem value="equals" className="rounded-lg">Equals</SelectItem>
                                                                                    <SelectItem value="notEquals" className="rounded-lg">Not Equals</SelectItem>
                                                                                    <SelectItem value="contains" className="rounded-lg">Contains</SelectItem>
                                                                                    <SelectItem value="notContains" className="rounded-lg">Not Contains</SelectItem>
                                                                                    <SelectItem value="matches" className="rounded-lg">Matches (Regex)</SelectItem>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <SelectItem value="contains" className="rounded-lg">Contains</SelectItem>
                                                                                    <SelectItem value="notContains" className="rounded-lg">Not Contains</SelectItem>
                                                                                    <SelectItem value="equals" className="rounded-lg">Equals</SelectItem>
                                                                                    <SelectItem value="notEquals" className="rounded-lg">Not Equals</SelectItem>
                                                                                    <SelectItem value="matches" className="rounded-lg">Matches (Regex)</SelectItem>
                                                                                </>
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <button type="button" onClick={() => removeAssertion(index)} className="h-10 w-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors shrink-0">
                                                                <Trash2Icon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {type === 'header' && (
                                                            <FormField control={form.control} name={`assertions.${index}.property`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Header Key (e.g. Content-Type)" className="bg-surface-container-lowest border-none rounded-xl h-10 text-sm" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        )}
                                                        <FormField control={form.control} name={`assertions.${index}.value`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={type === 'status' ? 'Status Code (e.g. 200)' : type === 'header' ? 'Expected value' : 'Text to check'}
                                                                        className="bg-surface-container-lowest border-none rounded-xl h-10 text-sm"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant font-medium py-2">No assertions added yet.</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* TCP Configuration */}
                        {monitorType === 'tcp' && (
                            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                                <SectionLabel>TCP Connection</SectionLabel>
                                <FormField
                                    control={form.control}
                                    name="tcpHost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-on-surface-variant">Host:Port</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="127.0.0.1:8080"
                                                    className="bg-surface-container border-none rounded-xl h-11 font-medium"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs text-on-surface-variant mt-2">
                                                Supports IPv4, IPv6, and domain names. E.g. <code className="bg-surface-container px-1.5 py-0.5 rounded-md text-primary font-mono">openstatus.dev:443</code>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Notification Emails */}
                        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                            <SectionLabel>Notification Emails</SectionLabel>
                            <FormField
                                control={form.control}
                                name="emails"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                type="email"
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                placeholder="email@example.com"
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                                className="flex-1 bg-surface-container border-none rounded-xl h-11 font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddEmail}
                                                className="px-5 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {field.value.map((email, index) => (
                                                <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-sm font-medium">
                                                    {email}
                                                    <button type="button" onClick={() => handleRemoveEmail(email)} className="text-on-surface-variant hover:text-error transition-colors">
                                                        <XIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <FormMessage className="mt-2" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Check Frequency */}
                        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                            <SectionLabel>Check Frequency</SectionLabel>
                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger className="bg-surface-container border-none rounded-xl h-11 font-semibold">
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="300" className="rounded-lg">Every 5 minutes</SelectItem>
                                                <SelectItem value="600" className="rounded-lg">Every 10 minutes</SelectItem>
                                                <SelectItem value="900" className="rounded-lg">Every 15 minutes</SelectItem>
                                                <SelectItem value="1800" className="rounded-lg">Every 30 minutes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Monitoring Regions */}
                        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                            <SectionLabel>Monitoring Regions</SectionLabel>
                            <p className="text-xs text-on-surface-variant mb-4 font-medium">Select at least one region for your monitor probes.</p>
                            <FormField
                                control={form.control}
                                name="regions"
                                render={() => (
                                    <FormItem>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'us-east-1', label: 'US East (N. Virginia)', sublabel: 'North America', Icon: US },
                                                { id: 'eu-west-1', label: 'EU West (Ireland)', sublabel: 'Europe', Icon: IE },
                                                { id: 'ap-south-1', label: 'Asia Pacific (Mumbai)', sublabel: 'South Asia', Icon: IN }
                                            ].map((region) => (
                                                <FormField
                                                    key={region.id}
                                                    control={form.control}
                                                    name="regions"
                                                    render={({ field }) => {
                                                        const isChecked = field.value?.includes(region.id);
                                                        return (
                                                            <FormItem key={region.id}>
                                                                <FormControl>
                                                                    <label
                                                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                                                                            isChecked
                                                                                ? 'bg-primary/10 ring-2 ring-primary/30'
                                                                                : 'bg-surface-container hover:bg-surface-container-high'
                                                                        }`}
                                                                    >
                                                                        <Checkbox
                                                                            checked={isChecked}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...field.value, region.id])
                                                                                    : field.onChange(field.value?.filter(v => v !== region.id))
                                                                            }}
                                                                            className="sr-only"
                                                                        />
                                                                        <div className="w-10 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                                                            <region.Icon className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-sm font-bold ${isChecked ? 'text-primary' : 'text-on-surface'}`}>{region.label}</p>
                                                                            <p className="text-xs text-on-surface-variant font-medium">{region.sublabel}</p>
                                                                        </div>
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                                            isChecked ? 'bg-primary border-primary' : 'border-outline-variant'
                                                                        }`}>
                                                                            {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                        </div>
                                                                    </label>
                                                                </FormControl>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage className="mt-2" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!isFormReady}
                            className="w-full py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[0.99] active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                        >
                            Update Monitor
                        </button>
                    </form>
                </Form>
            </div>
        </ContentLayout>
    )
}

export default UpdateMonitorPage