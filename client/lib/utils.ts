import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateDifference = (dateString: string) => {
  const createdAt = new Date(dateString);
  const now = new Date();

  const diffInMs = now.getTime() - createdAt.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);

  const months = diffInMonths;
  const days = diffInDays % 30;
  const hours = diffInHours % 24;

  return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent with the request
  });

  if (response.status === 401) {
    // If unauthorized, redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return response;
};


export function parseTcpHost(input: string): { host: string; port: number } {
  const match = input.match(/^(.*):(\d+)$/);

  if (!match) {
    throw new Error(`Invalid host:port format: ${input}`);
  }

  return {
    host: match[1],
    port: Number(match[2]),
  };
}
