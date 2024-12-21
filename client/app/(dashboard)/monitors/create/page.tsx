"use client"

import { ContentLayout } from '@/components/dashboard/content-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from "@/hooks/use-toast"
import { XIcon } from 'lucide-react'
import React, { useState } from 'react'


import { fetchWithAuth } from '@/lib/utils'
import { IE, IN, US } from 'country-flag-icons/react/3x2'
import { useRouter } from 'next/navigation'

const Page = () => {
  const [url, setUrl] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [frequency, setFrequency] = useState<number | null>(null)
  const router = useRouter();

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput])
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = { url, emails, frequency }
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
        title: `${result.url}`,
        description: 'Monitor created successfully',
      })
      router.push(`/monitors/${result.id}`);
    } catch (error) {
      console.error('Error creating monitor:', error)
    }
  }

  return (
    <ContentLayout title='Create Monitor'>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">URL to monitor</label>
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://example.com'
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Notify</label>
          <div className="flex items-center mb-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder='Email address'
            />
            <Button type='button' onClick={handleAddEmail} className="ml-2">
              Add Email
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {emails.map((email, index) => (
              <Badge key={index} variant="outline" className="flex items-center p-2 gap-2">
                {email}
                <XIcon className='w-4 h-4 text-gray-400 hover:text-white hover:cursor-pointer' onClick={() => handleRemoveEmail(email)} />
              </Badge>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Check frequency</label>
          <Select value={frequency?.toString() || ''} onValueChange={(value) => setFrequency(Number(value))} required>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="600">10 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='mb-4'>
          <label className="block text-sm font-medium mb-2">Regions</label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-2 p-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <US className="w-full h-full object-cover" />
              </div>
              US East
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 p-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <IE className="w-full h-full object-cover" />
              </div>
              EU West
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 p-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <IN className="w-full h-full object-cover" />
              </div>
              Asia Pacific
            </Badge>
          </div>
        </div>
        <Button type="submit" className='mt-10'>Create Monitor</Button>
      </form>
    </ContentLayout>
  )
}

export default Page