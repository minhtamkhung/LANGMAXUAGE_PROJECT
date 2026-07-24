import { useState } from 'react'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className={`flex-1 px-8 py-8 min-h-screen transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
                {children}
            </main>
            <CommandPalette />
        </div>
    )
}