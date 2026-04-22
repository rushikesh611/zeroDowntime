"use client"

import { ContentLayout } from '@/components/dashboard/content-layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from "@/hooks/use-toast"
import { fetchWithAuth, parseTcpHost } from '@/lib/utils'
import { zodResolver } from "@hookform/resolvers/zod"
import { IE, IN, US } from 'country-flag-icons/react/3x2'
import { ArrowLeft, BellIcon, InfoIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { useFieldArray, useForm } from "react-hook-form"
import { useAppStore } from '@/store/useAppStore'
import * as z from "zod"
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

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
  monitorType: z.enum(['http', 'tcp']),
  url: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
  headers: z.array(headerSchema),
  assertions: z.array(assertionSchema),
  tcpHost: z.string().optional(),
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
  } else if (data.monitorType === 'tcp') {
    if (!data.tcpHost) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TCP Host is required", path: ["tcpHost"] });
    } else if (!/^(.*):(\d+)$/.test(data.tcpHost)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid TCP Host format. Expected host:port", path: ["tcpHost"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">{children}</p>
)

const Page = () => {
  const router = useRouter()
  const { notifiers, fetchNotifiers, user } = useAppStore()

  useEffect(() => {
    fetchNotifiers()
  }, [fetchNotifiers])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      monitorType: 'http',
      method: 'GET',
      url: '',
      tcpHost: '',
      notifierId: '',
      regions: [],
      headers: [],
      assertions: [],
    }
  })

  const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({ control: form.control, name: "headers" })
  const { fields: assertionFields, append: appendAssertion, remove: removeAssertion } = useFieldArray({ control: form.control, name: "assertions" })

  const onSubmit = async (data: FormValues) => {
    const payload = {
      name: data.name,
      monitorType: data.monitorType,
      ...(data.monitorType === 'http' ? {
        method: data.method,
        url: data.url,
        headers: data.headers.filter(h => h.key && h.value),
        assertions: data.assertions
      } : {
        host: parseTcpHost(data.tcpHost!).host,
        port: parseTcpHost(data.tcpHost!).port
      }),
      notifierId: data.notifierId,
      frequency: data.frequency,
      regions: data.regions
    }

    try {
      const response = await fetchWithAuth('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to create monitor')
      const result = await response.json()
      toast({ title: 'Monitor created', description: 'Monitor created successfully' })
      router.push(`/monitors/${result.id}`)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create monitor', variant: 'destructive' })
    }
  }

  const monitorType = form.watch('monitorType');
  const watchedUrl = form.watch('url');
  const watchedTcpHost = form.watch('tcpHost');
  const watchedNotifierId = form.watch('notifierId');
  const watchedFrequency = form.watch('frequency');
  const watchedRegions = form.watch('regions');

  const isFormReady = (() => {
    if (monitorType === 'http' && !watchedUrl) return false;
    if (monitorType === 'tcp' && !watchedTcpHost) return false;
    if (!watchedNotifierId) return false;
    if (!watchedFrequency || watchedFrequency < 1) return false;
    if (!watchedRegions || watchedRegions.length === 0) return false;
    return true;
  })();

  const plan = user?.plan || 'FREE';
  const maxRegions = plan === 'FREE' ? 3 : plan === 'PRO' ? 5 : 10;
  const regionsDisabled = watchedRegions?.length >= maxRegions;

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
            Back to Monitors
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-on-surface mb-1">Create Monitor</h1>
          <p className="text-sm text-on-surface-variant">Configure your monitor settings and endpoints.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Monitor Name */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <SectionLabel>Monitor Name</SectionLabel>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="My Website Monitor"
                        className="bg-surface-container border-none rounded-xl h-11 font-medium focus:bg-surface-container-high transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-on-surface-variant mt-2">
                      An optional name to identify your monitor easily.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                            className={`py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
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
                              <SelectContent className="rounded-2xl border-none shadow-xl">
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((method) => (
                                  <SelectItem key={method} value={method} className="rounded-xl">{method}</SelectItem>
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
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                      <SelectItem value="status" className="rounded-xl">Status</SelectItem>
                                      <SelectItem value="header" className="rounded-xl">Header</SelectItem>
                                      <SelectItem value="body" className="rounded-xl">Body</SelectItem>
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
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                      {type === 'status' ? (
                                        <>
                                          <SelectItem value="equals" className="rounded-xl">Equals</SelectItem>
                                          <SelectItem value="notEquals" className="rounded-xl">Not Equals</SelectItem>
                                          <SelectItem value="greaterThan" className="rounded-xl">Greater Than</SelectItem>
                                          <SelectItem value="lessThan" className="rounded-xl">Less Than</SelectItem>
                                        </>
                                      ) : type === 'header' ? (
                                        <>
                                          <SelectItem value="equals" className="rounded-xl">Equals</SelectItem>
                                          <SelectItem value="notEquals" className="rounded-xl">Not Equals</SelectItem>
                                          <SelectItem value="contains" className="rounded-xl">Contains</SelectItem>
                                          <SelectItem value="matches" className="rounded-xl">Matches (Regex)</SelectItem>
                                        </>
                                      ) : (
                                        <>
                                          <SelectItem value="contains" className="rounded-xl">Contains</SelectItem>
                                          <SelectItem value="notContains" className="rounded-xl">Not Contains</SelectItem>
                                          <SelectItem value="equals" className="rounded-xl">Equals</SelectItem>
                                          <SelectItem value="matches" className="rounded-xl">Matches (Regex)</SelectItem>
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

            {/* Alert Channel */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Alert Channel</SectionLabel>
                <Link href="/notifications" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  <PlusIcon className="w-3 h-3" />
                  Manage Channels
                </Link>
              </div>

              {notifiers.length === 0 ? (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <BellIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mb-1">No notification channels found</h3>
                  <p className="text-xs text-on-surface-variant mb-4 max-w-[240px]">You need to add at least one notification channel (Email or Webhook) before you can create a monitor.</p>
                  <Button
                    asChild
                    variant="default"
                    className="rounded-xl h-10 px-6 font-bold shadow-md shadow-primary/20"
                  >
                    <Link href="/notifications">Create a Channel</Link>
                  </Button>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="notifierId"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-surface-container border-none rounded-xl h-11 font-semibold">
                            <SelectValue placeholder="Select a notification channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          {notifiers.map((notifier) => (
                            <SelectItem key={notifier.id} value={notifier.id} className="rounded-xl py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold flex items-center gap-2">
                                  {notifier.name}
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-black">
                                    {notifier.type}
                                  </span>
                                </span>
                                <span className="text-xs font-medium text-on-surface-variant truncate max-w-[300px]">
                                  {notifier.details}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                        <InfoIcon className="w-3 h-3 shrink-0" />
                        Alerts will be sent to this channel when the monitor detects downtime.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Check Frequency */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <SectionLabel>Check Frequency</SectionLabel>
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-surface-container border-none rounded-xl h-11 font-semibold">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-xl">
                        {plan === 'PRO_PLUS' && <SelectItem value="30" className="rounded-xl">Every 30 seconds</SelectItem>}
                        {(plan === 'PRO' || plan === 'PRO_PLUS') && <SelectItem value="60" className="rounded-xl">Every 1 minute</SelectItem>}
                        <SelectItem value="300" className="rounded-xl" disabled={plan === 'FREE'}>Every 5 minutes</SelectItem>
                        <SelectItem value="600" className="rounded-xl" disabled={plan === 'FREE'}>Every 10 minutes</SelectItem>
                        <SelectItem value="900" className="rounded-xl">Every 15 minutes</SelectItem>
                        <SelectItem value="1800" className="rounded-xl">Every 30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    {plan === 'FREE' && (
                        <p className="text-xs text-primary mt-2 flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3" /> Upgrade to Pro for 1-minute checks
                        </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Monitoring Regions */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <SectionLabel>Monitoring Regions</SectionLabel>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                    {watchedRegions?.length || 0} / {maxRegions} selected
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 font-medium">Select regions for your monitor probes. {plan === 'FREE' && 'Upgrade to Pro to select more regions.'}</p>
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
              Create Monitor
            </button>
          </form>
        </Form>
      </div>
    </ContentLayout>
  )
}

export default Page