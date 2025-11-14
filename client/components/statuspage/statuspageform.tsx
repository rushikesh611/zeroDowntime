"use client";
import { Monitor } from "@/types";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
    monitorId: z.string({
        required_error: "Please select a monitor",
    }),
    subdomain: z.string()
        .min(3, { message: "Subdomain must be at least 3 characters" })
        .max(20, { message: "Subdomain can't be longer than 20 characters" })
        .regex(/^[a-z0-9-]+$/, {
            message: "Subdomain can only contain lowercase letters, numbers and hyphens"
        }),
    title: z.string()
        .min(1, { message: "Title is required" })
        .max(100, { message: "Title can't be longer than 100 characters" }),
    description: z.string()
        .max(500, { message: "Description can't be longer than 500 characters" })
        .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StatusPageFormProps {
    monitors: Monitor[];
    onSuccess: () => void;
}

const StatusPageForm = ({ monitors, onSuccess }: StatusPageFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const baseUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_BASE_URL || "status.localhost.com";

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            monitorId: "",
            subdomain: "",
            title: "",
            description: "",
        },
    })

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/status-pages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create status page");
            }
            toast({
                title: "Status page created",
                description: `Your status page is now live at ${data.subdomain}.${baseUrl}`,
            });

            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error creating status page",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="monitorId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Monitor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a monitor" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {monitors.map((monitor) => (
                                        <SelectItem key={monitor.id} value={monitor.id}>
                                            {monitor.url}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Choose the monitor you want to create a status page for
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subdomain</FormLabel>
                            <div className="flex items-center">
                                <FormControl>
                                    <Input
                                        placeholder="your-status-page"
                                        {...field}
                                        className="rounded-r-none"
                                    />
                                </FormControl>
                                <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground">
                                    .{baseUrl}
                                </span>
                            </div>

                            <FormDescription>
                                Choose a unique name for your status page
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Service Status" {...field} />
                            </FormControl>
                            <FormDescription>
                                Give your status page a title
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Status page for our service"
                                    {...field}
                                    className="resize-none"
                                    rows={3}
                                />
                            </FormControl>
                            <FormDescription>
                                Provide additional information about your service
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Status Page"}
                </Button>
            </form>
        </Form>
    )
}

export default StatusPageForm