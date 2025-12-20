import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Page Not Found
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
                Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or doesn&apos;t exist.
            </p>
            <div className="mt-10">
                <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    Go back home
                </Link>
            </div>
        </div>
    )
}
