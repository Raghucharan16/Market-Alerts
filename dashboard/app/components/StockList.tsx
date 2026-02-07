'use client'

import { Trash2, TrendingUp, TrendingDown, Power } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'

interface Stock {
    id: number
    symbol: string
    atp_price: number
    profit_threshold: number
    loss_threshold: number
    is_active: boolean
}

export default function StockList({ stocks, onUpdate }: { stocks: Stock[], onUpdate: () => void }) {
    const [loadingId, setLoadingId] = useState<number | null>(null)

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        setLoadingId(id)
        try {
            const { error } = await supabase
                .from('stocks')
                .update({ is_active: !currentStatus })
                .eq('id', id)

            if (error) throw error
            onUpdate()
        } catch (err) {
            console.error('Error toggling status:', err)
        } finally {
            setLoadingId(null)
        }
    }

    const deleteItem = async (id: number) => {
        if (!confirm('Are you sure you want to delete this stock?')) return
        setLoadingId(id)
        try {
            const { error } = await supabase
                .from('stocks')
                .delete()
                .eq('id', id)

            if (error) throw error
            onUpdate()
        } catch (err) {
            console.error('Error deleting stock:', err)
        } finally {
            setLoadingId(null)
        }
    }

    if (stocks.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-800 rounded-lg border border-gray-700">
                No stocks tracked yet. Add one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stocks.map((stock) => {
                const profitTarget = (stock.atp_price * (1 + stock.profit_threshold / 100)).toFixed(2)
                const lossTarget = (stock.atp_price * (1 - stock.loss_threshold / 100)).toFixed(2)
                const isLoading = loadingId === stock.id

                return (
                    <div
                        key={stock.id}
                        className={`p-5 rounded-lg border transition duration-200 relative group ${stock.is_active
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                            : 'bg-gray-900 border-gray-800 opacity-60'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
                                <p className="text-xs text-gray-400">ATP: ₹{stock.atp_price}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleStatus(stock.id, stock.is_active)}
                                    disabled={isLoading}
                                    className={`p-1.5 rounded-full transition ${stock.is_active ? 'text-green-400 hover:bg-green-900/30' : 'text-gray-500 hover:bg-gray-800'}`}
                                    title={stock.is_active ? "Pause Alerts" : "Resume Alerts"}
                                >
                                    <Power size={18} className={isLoading ? "animate-pulse" : ""} />
                                </button>
                                <button
                                    onClick={() => deleteItem(stock.id)}
                                    disabled={isLoading}
                                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-full transition"
                                    title="Delete Stock"
                                >
                                    <Trash2 size={18} className={isLoading ? "animate-pulse" : ""} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                <div className="flex items-center gap-1 text-green-400 mb-1">
                                    <TrendingUp size={14} />
                                    <span>Target</span>
                                </div>
                                <div className="font-mono text-white">₹{profitTarget}</div>
                                <div className="text-xs text-gray-500">+{stock.profit_threshold}%</div>
                            </div>
                            <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                <div className="flex items-center gap-1 text-red-400 mb-1">
                                    <TrendingDown size={14} />
                                    <span>Stop</span>
                                </div>
                                <div className="font-mono text-white">₹{lossTarget}</div>
                                <div className="text-xs text-gray-500">-{stock.loss_threshold}%</div>
                            </div>
                        </div>

                        {!stock.is_active && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <span className="bg-black/80 text-gray-300 px-3 py-1 rounded text-xs border border-gray-700">Paused</span>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
