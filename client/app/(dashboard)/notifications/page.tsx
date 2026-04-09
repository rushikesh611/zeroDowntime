"use client"

import { useState } from "react"
import { ContentLayout } from '@/components/dashboard/content-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EllipsisIcon, Settings, TrashIcon, Mail, Webhook, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Define Notifier Types
type NotifierType = 'Email' | 'Webhook';

interface Notifier {
    id: string;
    name: string;
    type: NotifierType;
    details: string; // Email address or Webhook URL
}

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
    const [notifiers, setNotifiers] = useState<Notifier[]>([
        { id: '1', name: 'Production Support', type: 'Email', details: 'support@example.com' },
    ])
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<NotifierType | null>(null)
    const [editingNotifierId, setEditingNotifierId] = useState<string | null>(null)

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

    const onEmailSubmit = (values: z.infer<typeof emailSchema>) => {
        if (editingNotifierId) {
            setNotifiers(notifiers.map(n => n.id === editingNotifierId ? { ...n, name: values.name, details: values.email } : n))
            toast({
                title: "Notifier Updated",
                description: `${values.name} has been updated.`,
            })
        } else {
            const newNotifier: Notifier = {
                id: Math.random().toString(36).substring(7),
                name: values.name,
                type: 'Email',
                details: values.email,
            }
            setNotifiers([newNotifier, ...notifiers])
            toast({
                title: "Notifier Created",
                description: `${values.name} has been added to your notifiers.`,
            })
        }
        setIsSheetOpen(false)
    }

    const onWebhookSubmit = (values: z.infer<typeof webhookSchema>) => {
        if (editingNotifierId) {
            setNotifiers(notifiers.map(n => n.id === editingNotifierId ? { ...n, name: values.name, details: values.url } : n))
            toast({
                title: "Notifier Updated",
                description: `${values.name} has been updated.`,
            })
        } else {
            const newNotifier: Notifier = {
                id: Math.random().toString(36).substring(7),
                name: values.name,
                type: 'Webhook',
                details: values.url,
            }
            setNotifiers([newNotifier, ...notifiers])
            toast({
                title: "Notifier Created",
                description: `${values.name} has been added to your notifiers.`,
            })
        }
        setIsSheetOpen(false)
    }

    const handleTest = (type: NotifierType) => {
        toast({
            title: "Test Sent",
            description: `A test notification has been sent to the provided ${type === 'Email' ? 'email' : 'URL'}.`,
        })
    }

    const handleDelete = (id: string) => {
        setNotifiers(notifiers.filter(n => n.id !== id))
        toast({
            title: "Notifier Deleted",
            description: "The notifier has been removed.",
            variant: "destructive"
        })
    }

    return (
        <ContentLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Define your notifications to receive alerts when downtime occurs.</p>
                </div>

                {/* Notifiers List */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Name</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notifiers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No notifiers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifiers.map((notifier) => (
                                    <TableRow
                                        key={notifier.id}
                                        className="group"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {notifier.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {notifier.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {notifier.details}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <EllipsisIcon className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenSheet(notifier.type, notifier)}
                                                        >
                                                            <Settings className="h-4 w-4 mr-2" />
                                                            Settings
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(notifier.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create a new notifier</h1>
                    <p className="text-muted-foreground">Select the type of notifier you want to create.</p>
                </div>

                {/* Create Notifier Options */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOpenSheet('Email')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Email
                            </CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Add a new email notifier
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOpenSheet('Webhook')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Webhook
                            </CardTitle>
                            <Webhook className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Add a new webhook notifier
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Creation Drawer */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>{editingNotifierId ? 'Edit' : 'Create'} {selectedType} Notifier</SheetTitle>
                        <SheetDescription>
                            {editingNotifierId ? 'Update the details of your' : 'Add a new'} {selectedType?.toLowerCase()} notification channel.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        {selectedType === 'Email' && (
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                                    <FormField
                                        control={emailForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="My Email Notifier" {...field} />
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
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="hello@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-4 pt-4">
                                        <Button type="button" variant="outline" className="w-full" onClick={() => handleTest('Email')}>
                                            Test
                                        </Button>
                                        <Button type="submit" className="w-full">
                                            {editingNotifierId ? 'Update' : 'Save'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {selectedType === 'Webhook' && (
                            <Form {...webhookForm}>
                                <form onSubmit={webhookForm.handleSubmit(onWebhookSubmit)} className="space-y-6">
                                    <FormField
                                        control={webhookForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="My Webhook" {...field} />
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
                                                <FormLabel>Webhook URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://api.example.com/webhook" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-4 pt-4">
                                        <Button type="button" variant="outline" className="w-full" onClick={() => handleTest('Webhook')}>
                                            Test
                                        </Button>
                                        <Button type="submit" className="w-full">
                                            {editingNotifierId ? 'Update' : 'Save'}
                                        </Button>
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