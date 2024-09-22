"use client";

import { Button } from "@/components/ui/button";

import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from "react";

export default function Dashboard() {
    const { logout } = useAuthStore()

    // if user is not logged in, redirect to home page
    useEffect(() => {
        if (!useAuthStore.getState().user) {
            window.location.href = '/'
        }
    }, [])

    return (
        <div>
            <h1>Dashboard</h1>
            <Button onClick={logout}>logout</Button>
        </div>
    )
}