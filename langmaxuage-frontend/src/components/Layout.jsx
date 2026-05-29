import Sidebar from './Sidebar'

export default function Layout({ children }) {
    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="ml-64 flex-1 px-8 py-8 min-h-screen">
                {children}
            </main>
        </div>
    )
}