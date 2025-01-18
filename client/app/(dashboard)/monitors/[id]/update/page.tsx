"use client"

import { ContentLayout } from "@/components/dashboard/content-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IE, IN, US } from "country-flag-icons/react/3x2"
import { XIcon } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

const UpdateMonitorPage = () => {
    const router = useRouter()
    const { id } = useParams()
    const [url, setUrl] = useState('')
    const [emailInput, setEmailInput] = useState('')
    const [emails, setEmails] = useState<string[]>([])
    const [frequency, setFrequency] = useState<number | null>(null)
    const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchMonitorData = async () => {
            try {
                const response = await fetchWithAuth(`/api/monitors/${id}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch monitor data')
                }
                const data = await response.json()
                setUrl(data.url)
                setEmails(data.emails)
                setFrequency(data.frequency)
                setSelectedRegions(new Set(data.regions))
            } catch (error) {
                console.error('Error fetching monitor data:', error)
            }
        }

        fetchMonitorData()
    }, [id])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const data = { url, emails, frequency, regions: Array.from(selectedRegions) }
        try {
            const response = await fetchWithAuth(`/api/monitors/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            if (!response.ok) {
                throw new Error('Failed to update monitor')
            }
            const result = await response.json()
            console.log('Monitor updated:', result)
            toast({
                    title: `${result.url}`,
                    description: 'Monitor updated successfully',
                  })
            router.push(`/monitors/${id}`)
        } catch (error) {
            console.error('Error updating monitor:', error)
        }
    }

    return (
        <ContentLayout title='Update Monitor'>
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
                    <label className="block text-sm font-medium text-gray-700">Emails</label>
                    <div className="flex items-center mb-2">
                        <Input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder='Email address'
                        />
                        <Button type="button" onClick={handleAddEmail} className="ml-2">
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
                    <label className="block text-sm font-medium text-gray-700">Check frequency</label>
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
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="us-east-1"
                                checked={selectedRegions.has('us-east-1')}
                                onCheckedChange={(checked) => {
                                    handleRegionChange(checked, 'us-east-1')
                                }}
                            />
                            <label htmlFor="us-east-1">
                                <Badge variant="outline" className="flex items-center gap-2 p-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden">
                                        <US className="w-full h-full object-cover" />
                                    </div>
                                    US East
                                </Badge>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="eu-west-1"
                                checked={selectedRegions.has('eu-west-1')}
                                onCheckedChange={(checked) => {
                                    handleRegionChange(checked, 'eu-west-1')
                                }}
                            />
                            <label htmlFor="eu-west-1">
                                <Badge variant="outline" className="flex items-center gap-2 p-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden">
                                        <IE className="w-full h-full object-cover" />
                                    </div>
                                    EU West
                                </Badge>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="ap-south-1"
                                checked={selectedRegions.has('ap-south-1')}
                                onCheckedChange={(checked) => {
                                    handleRegionChange(checked, 'ap-south-1')
                                }}
                            />
                            <label htmlFor="ap-south-1">
                                <Badge variant="outline" className="flex items-center gap-2 p-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden">
                                        <IN className="w-full h-full object-cover" />
                                    </div>
                                    Asia Pacific
                                </Badge>
                            </label>
                        </div>


                    </div>
                </div>

                <Button type="submit">Update Monitor</Button>
            </form>
        </ContentLayout>
    )
}

export default UpdateMonitorPage