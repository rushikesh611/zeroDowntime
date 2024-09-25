import React from 'react'
import { UserNav } from './user-nav'

export const Header = () => {
  return (
    <div className='p-1 w-screen'>
        <div className='flex flex-row justify-between'>
            <h1 className='text-2xl font-bold'>ZeroDowntime</h1>
            <UserNav />
        </div>
    </div>
  )
}
