"use client";
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthSuccess() {
    const router = useRouter()
    const { setToken, checkAuth } = useAuthStore()

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token')
        if (token) {
            setToken(token)
            checkAuth().then(() => {
                router.push('/dashboard')
            })
        } else {
            router.push('/')
        }
    }, [setToken, checkAuth, router])

    return <div>Authenticating...</div>
}