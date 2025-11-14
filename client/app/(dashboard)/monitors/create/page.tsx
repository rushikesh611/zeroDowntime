"use client"

import { ContentLayout } from '@/components/dashboard/content-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from "@/hooks/use-toast"
import { fetchWithAuth } from '@/lib/utils'
import { IE, IN, US } from 'country-flag-icons/react/3x2'
import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type MonitorType = 'http' | 'tcp'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'
type AssertionType = 'status' | 'header' | 'body'
type AssertionCondition = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'matches' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'

interface RequestHeader {
  key: string
  value: string
}

interface Assertion {
  id: string
  type: AssertionType
  condition: AssertionCondition
  property?: string
  value: string
}

const Page = () => {
  const [monitorType, setMonitorType] = useState<MonitorType>('http')
  const [httpMethod, setHttpMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [tcpHost, setTcpHost] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [frequency, setFrequency] = useState<number | null>(null)
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>([])
  const [assertions, setAssertions] = useState<Assertion[]>([])
  const router = useRouter()

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput])
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleRegionChange = (checked: boolean | "indeterminate", region: string) => {
    const newSelectedRegions = new Set(selectedRegions)
    if (checked === true) {
      newSelectedRegions.add(region)
    } else {
      newSelectedRegions.delete(region)
    }
    setSelectedRegions(newSelectedRegions)
  }

  const handleAddHeader = () => {
    setRequestHeaders([...requestHeaders, { key: '', value: '' }])
  }

  const handleRemoveHeader = (index: number) => {
    setRequestHeaders(requestHeaders.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...requestHeaders]
    updated[index][field] = value
    setRequestHeaders(updated)
  }

  const handleAddAssertion = () => {
    setAssertions([...assertions, {
      id: Date.now().toString(),
      type: 'status',
      condition: 'equals',
      value: ''
    }])
  }

  const handleRemoveAssertion = (id: string) => {
    setAssertions(assertions.filter(a => a.id !== id))
  }

  const handleAssertionChange = (id: string, field: keyof Assertion, value: string) => {
    const updated = assertions.map(a => {
      if (a.id === id) {
        const updatedAssertion = { ...a, [field]: value }
        if (field === 'type' && (value === 'status' || value === 'body')) {
          delete updatedAssertion.property
        }
        return updatedAssertion
      }
      return a
    })
    setAssertions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      monitorType: monitorType,
      ...(monitorType === 'http' ? {
        method: httpMethod,
        url,
        headers: requestHeaders.filter(h => h.key && h.value),
        assertions
      } : {
        host: tcpHost
      }),
      emails,
      frequency,
      regions: Array.from(selectedRegions)
    }

    console.log('Creating monitor:', data)
    try {
      const response = await fetchWithAuth('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error('Failed to create monitor')
      }
      const result = await response.json()
      console.log('Monitor created:', result)

      toast({
        title: 'Monitor created',
        description: 'Monitor created successfully',
      })
      router.push(`/monitors/${result.id}`)
    } catch (error) {
      console.error('Error creating monitor:', error)
      toast({
        title: 'Error',
        description: 'Failed to create monitor',
        variant: 'destructive'
      })
    }
  }

  return (
    <ContentLayout title='Create Monitor'>
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Monitor</h1>
          <p className="text-muted-foreground">Configure monitoring settings for your endpoint</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="overflow-hidden">
            {/* Monitor Type */}
            <div className="p-6">
              <label className="text-sm font-medium mb-3 block">Monitor Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={monitorType === 'http' ? 'default' : 'outline'}
                  onClick={() => setMonitorType('http')}
                  className="w-full"
                >
                  HTTP
                </Button>
                <Button
                  type="button"
                  variant={monitorType === 'tcp' ? 'default' : 'outline'}
                  onClick={() => setMonitorType('tcp')}
                  className="w-full"
                >
                  TCP
                </Button>
              </div>
            </div>

            <div className="border-t" />

            {/* HTTP Configuration */}
            {monitorType === 'http' && (
              <>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-sm font-medium mb-2 block">Method</label>
                      <Select value={httpMethod} onValueChange={(value) => setHttpMethod(value as HttpMethod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="HEAD">HEAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-sm font-medium mb-2 block">URL</label>
                      <Input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder='https://example.com/api'
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Request Headers */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Request Headers</label>
                    <Button type="button" size="sm" variant="ghost" onClick={handleAddHeader}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {requestHeaders.length > 0 ? (
                    <div className="space-y-2">
                      {requestHeaders.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Key"
                            value={header.key}
                            onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveHeader(index)}
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
                    <Button type="button" size="sm" variant="ghost" onClick={handleAddAssertion}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {assertions.length > 0 ? (
                    <div className="space-y-3">
                      {assertions.map((assertion) => (
                        <div key={assertion.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex gap-2">
                            <Select
                              value={assertion.type}
                              onValueChange={(value) => handleAssertionChange(assertion.id, 'type', value)}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="body">Body</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={assertion.condition}
                              onValueChange={(value) => handleAssertionChange(assertion.id, 'condition', value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {assertion.type === 'status' ? (
                                  <>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="notEquals">Not Equals</SelectItem>
                                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                                    <SelectItem value="lessThan">Less Than</SelectItem>
                                    <SelectItem value="greaterThanOrEqual">Greater Than or Equal</SelectItem>
                                    <SelectItem value="lessThanOrEqual">Less Than or Equal</SelectItem>
                                  </>
                                ) : assertion.type === 'header' ? (
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

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveAssertion(assertion.id)}
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>

                          {assertion.type === 'header' && (
                            <Input
                              placeholder="Header Key"
                              value={assertion.property || ''}
                              onChange={(e) => handleAssertionChange(assertion.id, 'property', e.target.value)}
                            />
                          )}

                          <Input
                            placeholder={
                              assertion.type === 'status'
                                ? 'Status Code (e.g., 200)'
                                : assertion.type === 'header'
                                  ? 'Target Value'
                                  : 'Text to check'
                            }
                            value={assertion.value}
                            onChange={(e) => handleAssertionChange(assertion.id, 'value', e.target.value)}
                          />
                        </div>
                      ))}
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
                <label className="text-sm font-medium mb-2 block">Host:Port</label>
                <Input
                  type="text"
                  value={tcpHost}
                  onChange={(e) => setTcpHost(e.target.value)}
                  placeholder='example.com:443 or 192.168.1.1:80'
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supports IPv4, IPv6, and domain names
                </p>
              </div>
            )}

            <Separator />

            {/* Notification Emails */}
            <div className="p-6">
              <label className="text-sm font-medium mb-2 block">Notification Emails</label>
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
              {emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {emails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      <span className="mr-2">{email}</span>
                      <XIcon
                        className='w-3 h-3 cursor-pointer hover:text-destructive'
                        onClick={() => handleRemoveEmail(email)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Check Frequency */}
            <div className="p-6">
              <label className="text-sm font-medium mb-2 block">Check Frequency</label>
              <Select value={frequency?.toString() || ''} onValueChange={(value) => setFrequency(Number(value))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Every 5 minutes</SelectItem>
                  <SelectItem value="600">Every 10 minutes</SelectItem>
                  <SelectItem value="900">Every 15 minutes</SelectItem>
                  <SelectItem value="1800">Every 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Monitoring Regions */}
            <div className="p-6">
              <label className="text-sm font-medium mb-3 block">Monitoring Regions</label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="us-east-1"
                    checked={selectedRegions.has('us-east-1')}
                    onCheckedChange={(checked) => handleRegionChange(checked, 'us-east-1')}
                  />
                  <label htmlFor="us-east-1" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <US className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm">US East (N. Virginia)</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="eu-west-1"
                    checked={selectedRegions.has('eu-west-1')}
                    onCheckedChange={(checked) => handleRegionChange(checked, 'eu-west-1')}
                  />
                  <label htmlFor="eu-west-1" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <IE className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm">EU West (Ireland)</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="ap-south-1"
                    checked={selectedRegions.has('ap-south-1')}
                    onCheckedChange={(checked) => handleRegionChange(checked, 'ap-south-1')}
                  />
                  <label htmlFor="ap-south-1" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <IN className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm">Asia Pacific (Mumbai)</span>
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="p-6">
              <Button type="submit" className="w-full">
                Create Monitor
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </ContentLayout>
  )
}

export default Page