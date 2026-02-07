'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface Alert {
    id: number
    stock_id: number
    alert_type: 'profit' | 'loss'
    current_price: number
    threshold_price: number
    atp_price: number
    percentage_change: number
    is_acknowledged: boolean
    created_at: string
    stocks: {
        symbol: string
    }
}

export default function AlertsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [user, setUser] = useState<any>(null)

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
        } else {
            setUser(session.user)
            fetchAlerts()
        }
        setLoading(false)
    }

    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from('alerts')
                .select('*, stocks(symbol)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAlerts(data || [])
        } catch (error) {
            console.error('Error fetching alerts:', error)
        }
    }

    const handleAcknowledge = async (id: number) => {
        try {
            const { error } = await supabase
                .from('alerts')
                .update({
                    is_acknowledged: true,
                    acknowledged_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            // Refresh local state without refetching all
            setAlerts(prev => prev.map(a =>
                a.id === id ? { ...a, is_acknowledged: true } : a
            ))
        } catch (error) {
            console.error('Error acknowledging alert:', error)
            alert("Failed to acknowledge")
        }
    }

    useEffect(() => {
        checkUser()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-800 rounded-full transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-bold text-white">
                            Alerts History
                        </h1>
                    </div>
                </header>

                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-900 rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No alerts generated yet.</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-lg border ${alert.is_acknowledged
                                        ? 'bg-gray-900/50 border-gray-800 opacity-75'
                                        : 'bg-gray-900 border-gray-700 shadow-lg shadow-emerald-500/5'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {alert.alert_type === 'profit' ? (
                                                <TrendingUp className="text-emerald-500" size={20} />
                                            ) : (
                                                <TrendingDown className="text-rose-500" size={20} />
                                            )}
                                            <h3 className="font-bold text-lg">{alert.stocks?.symbol || 'Unknown Stock'}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${alert.alert_type === 'profit'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {alert.alert_type.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Reached <span className="text-white font-mono">₹{alert.current_price}</span>
                                            {' '}(Target: ₹{alert.threshold_price})
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        {!alert.is_acknowledged && (
                                            <button
                                                onClick={() => handleAcknowledge(alert.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition duration-200"
                                            >
                                                <CheckCircle size={16} />
                                                Acknowledge
                                            </button>
                                        )}
                                        {alert.is_acknowledged && (
                                            <span className="flex items-center gap-1 text-emerald-500 text-sm">
                                                <CheckCircle size={16} />
                                                Seen
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
}
