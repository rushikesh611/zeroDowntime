"use client"

import { ContentLayout } from "@/components/dashboard/content-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { fetchWithAuth, parseTcpHost } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { IE, IN, US } from "country-flag-icons/react/3x2"
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react"
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
        } else if (!/^(.*):(\d+)$/.test(data.tcpHost)) {
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

const UpdateMonitorPage = () => {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [emailInput, setEmailInput] = useState('')

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
                    <p className="text-muted-foreground">Loading monitor data...</p>
                </div>
            </ContentLayout>
        )
    }

    const monitorType = form.watch('monitorType');

    return (
        <ContentLayout>
            <div className="mx-auto max-w-2xl py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Update Monitor</h1>
                    <p className="text-muted-foreground">Modify monitoring settings for your endpoint</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card className="overflow-hidden">
                            {/* Monitor Type */}
                            <div className="p-6">
                                <FormField
                                    control={form.control}
                                    name="monitorType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium mb-3 block">Monitor Type</FormLabel>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'http' ? 'default' : 'outline'}
                                                        onClick={() => field.onChange('http')}
                                                        className="w-full"
                                                    >
                                                        HTTP
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'tcp' ? 'default' : 'outline'}
                                                        onClick={() => field.onChange('tcp')}
                                                        className="w-full"
                                                    >
                                                        TCP
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* HTTP Configuration */}
                            {monitorType === 'http' && (
                                <>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="col-span-1">
                                                <FormField
                                                    control={form.control}
                                                    name="method"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Method</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Method" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((method) => (
                                                                        <SelectItem key={method} value={method}>{method}</SelectItem>
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
                                                            <FormLabel>URL</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="https://example.com/api" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Request Headers */}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium">Request Headers</label>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => appendHeader({ key: '', value: '' })}>
                                                <PlusIcon className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                        {headerFields.length > 0 ? (
                                            <div className="space-y-2">
                                                {headerFields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`headers.${index}.key`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-1">
                                                                    <FormControl>
                                                                        <Input placeholder="Key" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`headers.${index}.value`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-1">
                                                                    <FormControl>
                                                                        <Input placeholder="Value" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => removeHeader(index)}
                                                        >
                                                            <Trash2Icon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No headers added</p>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Assertions */}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium">Assertions</label>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => appendAssertion({ id: Date.now().toString(), type: 'status', condition: 'equals', value: '' })}>
                                                <PlusIcon className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                        {assertionFields.length > 0 ? (
                                            <div className="space-y-3">
                                                {assertionFields.map((field, index) => {
                                                    const type = form.watch(`assertions.${index}.type`);
                                                    return (
                                                        <div key={field.id} className="border rounded-lg p-3 space-y-2">
                                                            <div className="flex gap-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`assertions.${index}.type`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <Select onValueChange={(val) => {
                                                                                field.onChange(val);
                                                                                if (val === 'status' || val === 'body') {
                                                                                    form.setValue(`assertions.${index}.property`, undefined);
                                                                                }
                                                                            }} defaultValue={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger className="w-[110px]">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="status">Status</SelectItem>
                                                                                    <SelectItem value="header">Header</SelectItem>
                                                                                    <SelectItem value="body">Body</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name={`assertions.${index}.condition`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex-1">
                                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    {type === 'status' ? (
                                                                                        <>
                                                                                            <SelectItem value="equals">Equals</SelectItem>
                                                                                            <SelectItem value="notEquals">Not Equals</SelectItem>
                                                                                            <SelectItem value="greaterThan">Greater Than</SelectItem>
                                                                                            <SelectItem value="lessThan">Less Than</SelectItem>
                                                                                            <SelectItem value="greaterThanOrEqual">Greater Than or Equal</SelectItem>
                                                                                            <SelectItem value="lessThanOrEqual">Less Than or Equal</SelectItem>
                                                                                        </>
                                                                                    ) : type === 'header' ? (
                                                                                        <>
                                                                                            <SelectItem value="equals">Equals</SelectItem>
                                                                                            <SelectItem value="notEquals">Not Equals</SelectItem>
                                                                                            <SelectItem value="contains">Contains</SelectItem>
                                                                                            <SelectItem value="notContains">Not Contains</SelectItem>
                                                                                            <SelectItem value="matches">Matches (Regex)</SelectItem>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <SelectItem value="contains">Contains</SelectItem>
                                                                                            <SelectItem value="notContains">Not Contains</SelectItem>
                                                                                            <SelectItem value="equals">Equals</SelectItem>
                                                                                            <SelectItem value="notEquals">Not Equals</SelectItem>
                                                                                            <SelectItem value="matches">Matches (Regex)</SelectItem>
                                                                                        </>
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => removeAssertion(index)}
                                                                >
                                                                    <Trash2Icon className="w-4 h-4" />
                                                                </Button>
                                                            </div>

                                                            {type === 'header' && (
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`assertions.${index}.property`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input placeholder="Header Key" {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            )}

                                                            <FormField
                                                                control={form.control}
                                                                name={`assertions.${index}.value`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder={
                                                                                    type === 'status'
                                                                                        ? 'Status Code (e.g., 200)'
                                                                                        : type === 'header'
                                                                                            ? 'Target Value'
                                                                                            : 'Text to check'
                                                                                }
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No assertions added</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* TCP Configuration */}
                            {monitorType === 'tcp' && (
                                <div className="p-6">
                                    <FormField
                                        control={form.control}
                                        name="tcpHost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Host:Port</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="127.0.0.1:8080" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The input supports both IPv4 addresses and IPv6 addresses.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <Separator />

                            {/* Notification Emails */}
                            <div className="p-6">
                                <FormField
                                    control={form.control}
                                    name="emails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notification Emails</FormLabel>
                                            <div className="flex gap-2 mb-3">
                                                <Input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={(e) => setEmailInput(e.target.value)}
                                                    placeholder='email@example.com'
                                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                                    className="flex-1"
                                                />
                                                <Button type='button' onClick={handleAddEmail} variant="secondary">
                                                    Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {field.value.map((email, index) => (
                                                    <Badge key={index} variant="secondary" className="px-2 py-1">
                                                        <span className="mr-2">{email}</span>
                                                        <XIcon
                                                            className='w-3 h-3 cursor-pointer hover:text-destructive'
                                                            onClick={() => handleRemoveEmail(email)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Check Frequency */}
                            <div className="p-6">
                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Check Frequency</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="300">Every 5 minutes</SelectItem>
                                                    <SelectItem value="600">Every 10 minutes</SelectItem>
                                                    <SelectItem value="900">Every 15 minutes</SelectItem>
                                                    <SelectItem value="1800">Every 30 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Monitoring Regions */}
                            <div className="p-6">
                                <FormField
                                    control={form.control}
                                    name="regions"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium mb-3 block">Monitoring Regions</FormLabel>
                                            <div className="space-y-2">
                                                {[
                                                    { id: 'us-east-1', label: 'US East (N. Virginia)', Icon: US },
                                                    { id: 'eu-west-1', label: 'EU West (Ireland)', Icon: IE },
                                                    { id: 'ap-south-1', label: 'Asia Pacific (Mumbai)', Icon: IN }
                                                ].map((region) => (
                                                    <FormField
                                                        key={region.id}
                                                        control={form.control}
                                                        name="regions"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={region.id}
                                                                    className="flex flex-row items-center space-x-3 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(region.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...field.value, region.id])
                                                                                    : field.onChange(
                                                                                        field.value?.filter(
                                                                                            (value) => value !== region.id
                                                                                        )
                                                                                    )
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal flex items-center gap-2 cursor-pointer flex-1">
                                                                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                                                            <region.Icon className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <span className="text-sm">{region.label}</span>
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Submit Button */}
                            <div className="p-6">
                                <Button type="submit" className="w-full">
                                    Update Monitor
                                </Button>
                            </div>
                        </Card>
                    </form>
                </Form>
            </div>
        </ContentLayout>
    )
}

export default UpdateMonitorPage