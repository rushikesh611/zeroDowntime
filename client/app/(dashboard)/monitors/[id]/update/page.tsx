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
import { getFriendlyErrorMessage } from "@/lib/errors"
import { zodResolver } from "@hookform/resolvers/zod"
import { IE, IN, US, DE, SG, BR, AU } from 'country-flag-icons/react/3x2'
import { ArrowLeft, BellIcon, InfoIcon, PlusIcon, Trash2Icon, Globe, Settings2, ShieldCheck, Mail } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
    name: z.string().optional(),
    monitorType: z.enum(['http', 'tcp', 'dns', 'ssl', 'ping', 'graphql']),
    url: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
    headers: z.array(headerSchema),
    assertions: z.array(assertionSchema),
    tcpHost: z.string().optional(),
    dnsRecordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).optional(),
    expectedIp: z.string().optional(),
    query: z.string().optional(),
    notifierId: z.string().min(1, 'Notification channel is required'),
    frequency: z.coerce.number().min(1, 'Frequency is required'),
    regions: z.array(z.string()).min(1, 'At least one region is required')
}).superRefine((data, ctx) => {
    if (data.monitorType === 'http') {
        if (!data.url) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL is required", path: ["url"] });
        } else {
            try { z.string().url().parse(data.url); } catch {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid URL", path: ["url"] });
            }
        }
    } else if (data.monitorType === 'graphql') {
        if (!data.url) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL is required", path: ["url"] });
        } else {
            try { z.string().url().parse(data.url); } catch {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid URL", path: ["url"] });
            }
        }
        if (!data.query) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GraphQL Query is required", path: ["query"] });
    } else if (['tcp', 'ssl', 'ping', 'dns'].includes(data.monitorType)) {
        if (!data.tcpHost) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Target host is required", path: ["tcpHost"] });
        } else if (data.monitorType === 'tcp' || data.monitorType === 'ssl') {
            if (!/^(.*):(\d+)$/.test(data.tcpHost) && data.monitorType === 'tcp') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid TCP Host format. Expected host:port", path: ["tcpHost"] });
            }
        }
    }
});

type FormValues = z.infer<typeof formSchema>

const UpdateMonitorPage = () => {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [initialMonitorType, setInitialMonitorType] = useState<string | null>(null)
    const { notifiers, fetchNotifiers, user } = useAppStore()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            monitorType: 'http',
            method: 'GET',
            url: '',
            tcpHost: '',
            dnsRecordType: 'A',
            expectedIp: '',
            query: '',
            notifierId: '',
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
        fetchNotifiers()
    }, [fetchNotifiers])

    useEffect(() => {
        const fetchMonitorData = async () => {
            try {
                const response = await fetchWithAuth(`/api/monitors/${id}`)
                if (!response.ok) throw new Error('Failed to fetch monitor data')
                const data = await response.json()

                const type = data.monitorType || data.type || 'http';
                setInitialMonitorType(type)
                let tcpHost = '';
                if (type === 'tcp' || type === 'ssl') {
                    tcpHost = data.host && data.port ? `${data.host}:${data.port}` : data.host || '';
                } else if (type === 'dns' || type === 'ping') {
                    tcpHost = data.host || '';
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
                    headers = Object.entries(data.headers).map(([key, value]) => ({ key, value: value as string }));
                }

                form.reset({
                    name: data.name || '',
                    monitorType: type,
                    method: data.method || 'GET',
                    url: data.url || '',
                    tcpHost,
                    dnsRecordType: data.dnsRecordType || 'A',
                    expectedIp: data.expectedIp || '',
                    query: data.query || '',
                    notifierId: data.notifierId || '',
                    regions: data.regions || [],
                    headers: headers,
                    assertions: assertions,
                    frequency: data.frequency
                });

                setLoading(false)
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to load monitor data', variant: 'destructive' })
                setLoading(false)
            }
        }
        fetchMonitorData()
    }, [id])

    const onSubmit = async (data: FormValues) => {
        let payload: any = {
            name: data.name,
            monitorType: data.monitorType,
            notifierId: data.notifierId,
            frequency: data.frequency,
            regions: data.regions
        };

        if (data.monitorType === 'http') {
            payload = {
                ...payload,
                method: data.method,
                url: data.url,
                headers: data.headers.filter(h => h.key && h.value).reduce((acc, h) => {
                    acc[h.key] = h.value;
                    return acc;
                }, {} as Record<string, string>),
                body: null,
                assertions: data.assertions,
            };
        } else if (data.monitorType === 'graphql') {
            payload = {
                ...payload,
                url: data.url,
                headers: data.headers.filter(h => h.key && h.value).reduce((acc, h) => {
                    acc[h.key] = h.value;
                    return acc;
                }, {} as Record<string, string>),
                query: data.query,
                assertions: data.assertions,
            };
        } else if (data.monitorType === 'tcp' || data.monitorType === 'ssl') {
            const parsed = parseTcpHost(data.tcpHost!);
            payload = {
                ...payload,
                host: parsed.host,
                port: parsed.port || (data.monitorType === 'ssl' ? 443 : 80),
                assertions: data.assertions
            };
        } else if (data.monitorType === 'dns') {
            payload = {
                ...payload,
                host: data.tcpHost,
                dnsRecordType: data.dnsRecordType || 'A',
                expectedIp: data.expectedIp,
                assertions: data.assertions
            };
        } else if (data.monitorType === 'ping') {
            payload = {
                ...payload,
                host: data.tcpHost,
                assertions: data.assertions
            };
        }

        try {
            const response = await fetchWithAuth(`/api/monitors/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw { message: data.error || 'Failed to update monitor', status: response.status };
            }
            toast({ title: 'Success', description: `Monitor updated successfully` })
            router.push(`/monitors/${id}`)
        } catch (error) {
            toast({ title: 'Error', description: getFriendlyErrorMessage(error, 'Failed to update monitor'), variant: 'destructive' })
        }
    }

    if (loading) {
        return (
            <ContentLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
                </div>
            </ContentLayout>
        )
    }

    const monitorType = form.watch('monitorType');
    const watchedUrl = form.watch('url');
    const watchedTcpHost = form.watch('tcpHost');
    const watchedNotifierId = form.watch('notifierId');
    const watchedFrequency = form.watch('frequency');
    const watchedRegions = form.watch('regions');

    const plan = user?.plan || 'FREE';
    const maxRegions = plan === 'FREE' ? 3 : plan === 'PRO' ? 5 : 10;
    const regionsDisabled = watchedRegions?.length >= maxRegions;

    const isFormReady = (() => {
        if (monitorType === 'http' && !watchedUrl) return false;
        if (monitorType === 'graphql' && (!watchedUrl || !form.watch('query'))) return false;
        if (['tcp', 'ssl', 'ping', 'dns'].includes(monitorType) && !watchedTcpHost) return false;
        if (!watchedNotifierId) return false;
        if (!watchedFrequency || watchedFrequency < 1) return false;
        if (!watchedRegions || watchedRegions.length === 0) return false;
        return true;
    })();

    return (
        <ContentLayout>
            <div className="mx-auto max-w-2xl py-6 space-y-8 animate-in fade-in-50 duration-500">
                {/* Header */}
                <div className="space-y-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()}
                        className="-ml-2 h-8 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Monitor
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Update Monitor</h1>
                        <p className="text-sm text-muted-foreground mt-1">Modify monitoring settings for your endpoint.</p>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <Card className="shadow-none border bg-card">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                                    General Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold">Monitor Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Production API" className="h-9 text-sm" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="monitorType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold">Monitor Type</FormLabel>
                                            <div className="grid grid-cols-3 gap-2 mt-1.5">
                                                {[
                                                    { id: 'http', label: 'HTTP/HTTPS', desc: 'Web endpoints', group: 'web' },
                                                    { id: 'tcp', label: 'TCP Port', desc: 'Port checks', group: 'host' },
                                                    { id: 'dns', label: 'DNS Query', desc: 'Resolutions', group: 'host' },
                                                    { id: 'ping', label: 'Ping / ICMP', desc: 'Host reach', group: 'host' },
                                                    { id: 'graphql', label: 'GraphQL', desc: 'API queries', group: 'web' }
                                                ].map((type) => {
                                                    const initialGroup = ['http', 'graphql'].includes(initialMonitorType || '') ? 'web' : 'host';
                                                    const isDisabled = type.group !== initialGroup;
                                                    return (
                                                        <Button
                                                            key={type.id}
                                                            type="button"
                                                            variant={field.value === type.id ? "default" : "outline"}
                                                            className="h-12 justify-start px-3 rounded-md"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                field.onChange(type.id);
                                                                if (type.id === 'dns' && !form.getValues('dnsRecordType')) {
                                                                    form.setValue('dnsRecordType', 'A');
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start text-left">
                                                                <span className="text-xs font-bold uppercase">{type.label}</span>
                                                                <span className="text-[9px] font-normal opacity-70 leading-none mt-0.5">
                                                                    {type.desc}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Configuration */}
                        <Card className="shadow-none border bg-card">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(monitorType === 'http' || monitorType === 'graphql') && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-4 gap-2">
                                            {monitorType === 'http' && (
                                                <FormField
                                                    control={form.control}
                                                    name="method"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-9 text-xs font-bold">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((method) => (
                                                                        <SelectItem key={method} value={method} className="text-xs">{method}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                            <FormField
                                                control={form.control}
                                                name="url"
                                                render={({ field }) => (
                                                    <FormItem className={monitorType === 'http' ? "col-span-3" : "col-span-4"}>
                                                        <FormControl>
                                                            <Input placeholder="https://api.example.com" className="h-9 text-sm" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {monitorType === 'graphql' && (
                                            <FormField
                                                control={form.control}
                                                name="query"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold">GraphQL Query</FormLabel>
                                                        <FormControl>
                                                            <textarea
                                                                placeholder="query { hello }"
                                                                className="w-full min-h-[100px] p-3 text-xs font-mono border rounded-md bg-muted/20 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                )}

                                {monitorType === 'tcp' && (
                                    <FormField
                                        control={form.control}
                                        name="tcpHost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="127.0.0.1:8080" className="h-9 text-sm" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    Host:Port format (e.g. example.com:443)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {monitorType === 'ssl' && (
                                    <FormField
                                        control={form.control}
                                        name="tcpHost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Host / Domain</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="example.com:443" className="h-9 text-sm" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    E.g. example.com:443 or example.com (defaults to port 443)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {monitorType === 'ping' && (
                                    <FormField
                                        control={form.control}
                                        name="tcpHost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold">Ping Destination</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="example.com" className="h-9 text-sm" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    Domain name or IP address to ping
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {monitorType === 'dns' && (
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="tcpHost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold">Domain to Resolve</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="example.com" className="h-9 text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="dnsRecordType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold">Record Type</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value || 'A'}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-9 text-sm">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'].map((record) => (
                                                                    <SelectItem key={record} value={record} className="text-xs">{record}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="expectedIp"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold">Expected Value (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. 1.1.1.1" className="h-9 text-sm" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* HTTP/GraphQL Advanced Settings */}
                        {(monitorType === 'http' || monitorType === 'graphql') && (
                            <Card className="shadow-none border bg-card">
                                <CardHeader className="pb-4 border-b">
                                    <CardTitle className="text-sm font-semibold">Advanced Checks</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 divide-y">
                                    {/* Headers */}
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Headers</h4>
                                            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => appendHeader({ key: '', value: '' })}>
                                                <PlusIcon className="mr-1 h-3 w-3" /> Add Header
                                            </Button>
                                        </div>
                                        {headerFields.length > 0 ? (
                                            <div className="space-y-2">
                                                {headerFields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-2 items-start">
                                                        <FormField control={form.control} name={`headers.${index}.key`} render={({ field }) => (
                                                            <Input placeholder="Key" className="h-8 text-xs flex-1" {...field} />
                                                        )} />
                                                        <FormField control={form.control} name={`headers.${index}.value`} render={({ field }) => (
                                                            <Input placeholder="Value" className="h-8 text-xs flex-1" {...field} />
                                                        )} />
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeHeader(index)}>
                                                            <Trash2Icon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No custom headers configured.</p>
                                        )}
                                    </div>

                                    {/* Assertions */}
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assertions</h4>
                                            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => appendAssertion({ id: Date.now().toString(), type: 'status', condition: 'equals', value: '' })}>
                                                <PlusIcon className="mr-1 h-3 w-3" /> Add Assertion
                                            </Button>
                                        </div>
                                        {assertionFields.length > 0 ? (
                                            <div className="space-y-3">
                                                {assertionFields.map((field, index) => {
                                                    const type = form.watch(`assertions.${index}.type`);
                                                    return (
                                                        <div key={field.id} className="p-3 border rounded-md bg-muted/30 space-y-2">
                                                            <div className="flex gap-2">
                                                                <FormField control={form.control} name={`assertions.${index}.type`} render={({ field }) => (
                                                                    <Select onValueChange={(val) => { field.onChange(val); if (val === 'status' || val === 'body') form.setValue(`assertions.${index}.property`, undefined); }} defaultValue={field.value}>
                                                                        <SelectTrigger className="h-8 w-[90px] text-[10px] font-bold uppercase">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="status" className="text-xs">Status</SelectItem>
                                                                            <SelectItem value="header" className="text-xs">Header</SelectItem>
                                                                            <SelectItem value="body" className="text-xs">Body</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )} />
                                                                <FormField control={form.control} name={`assertions.${index}.condition`} render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <SelectTrigger className="h-8 flex-1 text-[10px] font-semibold">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {type === 'status' ? (
                                                                                <>
                                                                                    <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                                                                                    <SelectItem value="notEquals" className="text-xs">Not Equals</SelectItem>
                                                                                    <SelectItem value="greaterThan" className="text-xs">Greater Than</SelectItem>
                                                                                    <SelectItem value="lessThan" className="text-xs">Less Than</SelectItem>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                                                                                    <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                                                                                    <SelectItem value="matches" className="text-xs">Regex</SelectItem>
                                                                                </>
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )} />
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeAssertion(index)}>
                                                                    <Trash2Icon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            {type === 'header' && (
                                                                <FormField control={form.control} name={`assertions.${index}.property`} render={({ field }) => (
                                                                    <Input placeholder="Header Name" className="h-8 text-xs" {...field} />
                                                                )} />
                                                            )}
                                                            <FormField control={form.control} name={`assertions.${index}.value`} render={({ field }) => (
                                                                <Input placeholder="Expected Value" className="h-8 text-xs" {...field} />
                                                            )} />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No response assertions defined.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notifications & Schedule */}
                        <Card className="shadow-none border bg-card">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    Alerts & Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="notifierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold">Notification Channel</FormLabel>
                                            <div className="flex gap-2">
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Select channel" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {notifiers.map((n) => (
                                                            <SelectItem key={n.id} value={n.id} className="text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-[9px] uppercase">{n.type}</Badge>
                                                                    <span>{n.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                                                    <Link href="/notifications"><PlusIcon className="h-4 w-4" /></Link>
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold">Check Interval</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="300" className="text-xs">Every 5 minutes</SelectItem>
                                                    <SelectItem value="600" className="text-xs">Every 10 minutes</SelectItem>
                                                    <SelectItem value="900" className="text-xs">Every 15 minutes</SelectItem>
                                                    <SelectItem value="1800" className="text-xs">Every 30 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Regions */}
                        <Card className="shadow-none border bg-card">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        Monitoring Regions
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-[10px]">
                                        {watchedRegions?.length || 0} / {maxRegions}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="regions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'us-east-1', label: 'US East', Icon: US },
                                                    { id: 'us-west-1', label: 'US West', Icon: US },
                                                    { id: 'eu-west-1', label: 'Ireland', Icon: IE },
                                                    { id: 'eu-central-1', label: 'Frankfurt', Icon: DE },
                                                    { id: 'ap-south-1', label: 'Mumbai', Icon: IN },
                                                    { id: 'ap-southeast-1', label: 'Singapore', Icon: SG },
                                                    { id: 'ap-southeast-2', label: 'Sydney', Icon: AU },
                                                    { id: 'sa-east-1', label: 'São Paulo', Icon: BR }
                                                ].map((region) => {
                                                    const isChecked = field.value?.includes(region.id);
                                                    return (
                                                        <label 
                                                            key={region.id}
                                                            className={`flex items-center gap-2 p-2 rounded-md border text-[11px] font-medium cursor-pointer transition-all ${
                                                                isChecked ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/10' : 'bg-muted/30 border-transparent hover:border-border'
                                                            } ${!isChecked && regionsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        >
                                                            <Checkbox 
                                                                checked={isChecked}
                                                                disabled={!isChecked && regionsDisabled}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked && regionsDisabled) {
                                                                        toast({ title: 'Limit Reached', description: `Max ${maxRegions} regions.`, variant: 'destructive' })
                                                                        return
                                                                    }
                                                                    const newValue = checked 
                                                                        ? [...field.value, region.id] 
                                                                        : field.value?.filter((v: string) => v !== region.id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <region.Icon className="h-3 w-4 shrink-0 rounded-[2px]" />
                                                            <span className="truncate">{region.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <FormMessage className="mt-2" />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <div className="pt-4 flex gap-3">
                            <Button type="submit" disabled={!isFormReady} className="flex-1 rounded-md h-11 font-bold">
                                Update Monitor
                            </Button>
                            <Button type="button" variant="outline" className="h-11 px-6" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ContentLayout>
    )
}

export default UpdateMonitorPage