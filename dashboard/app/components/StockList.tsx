'use client'

import { Trash2, TrendingUp, TrendingDown, Power, Edit, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'

interface Stock {
    id: number
    symbol: string
    buy_price: number
    profit_alert_pct: number
    loss_alert_pct: number
    is_active: boolean
}

export default function StockList({ stocks, onUpdate }: { stocks: Stock[], onUpdate: () => void }) {
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [editingStock, setEditingStock] = useState<Stock | null>(null)
    const [editForm, setEditForm] = useState({
        buy_price: '',
        profit_alert_pct: '',
        loss_alert_pct: ''
    })

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

    const startEditing = (stock: Stock) => {
        setEditingStock(stock)
        setEditForm({
            buy_price: stock.buy_price.toString(),
            profit_alert_pct: stock.profit_alert_pct.toString(),
            loss_alert_pct: stock.loss_alert_pct.toString()
        })
    }

    const saveEdit = async () => {
        if (!editingStock) return

        setLoadingId(editingStock.id)
        try {
            const { error } = await supabase
                .from('stocks')
                .update({
                    buy_price: parseFloat(editForm.buy_price),
                    profit_alert_pct: parseFloat(editForm.profit_alert_pct),
                    loss_alert_pct: parseFloat(editForm.loss_alert_pct)
                })
                .eq('id', editingStock.id)

            if (error) throw error
            setEditingStock(null)
            onUpdate()
        } catch (err) {
            console.error('Error updating stock:', err)
            alert('Failed to update stock')
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
                const profitTarget = (stock.buy_price * (1 + stock.profit_alert_pct / 100)).toFixed(2)
                const lossTarget = (stock.buy_price * (1 - stock.loss_alert_pct / 100)).toFixed(2)
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
                                <p className="text-xs text-gray-400">Buy Price: ₹{stock.buy_price}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEditing(stock)}
                                    disabled={isLoading}
                                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-full transition"
                                    title="Edit Stock"
                                >
                                    <Edit size={16} />
                                </button>
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
                                <div className="text-xs text-gray-500">+{stock.profit_alert_pct}%</div>
                            </div>
                            <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                <div className="flex items-center gap-1 text-red-400 mb-1">
                                    <TrendingDown size={14} />
                                    <span>Stop</span>
                                </div>
                                <div className="font-mono text-white">₹{lossTarget}</div>
                                <div className="text-xs text-gray-500">-{stock.loss_alert_pct}%</div>
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

            {/* Edit Modal */}
            {editingStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-gray-800">
                            <h3 className="text-lg font-bold text-white">Edit {editingStock.symbol}</h3>
                            <button
                                onClick={() => setEditingStock(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Buy Price (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.buy_price}
                                    onChange={(e) => setEditForm({ ...editForm, buy_price: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Profit Alert (%)</label>
                                    <input
                                        type="number"
                                        value={editForm.profit_alert_pct}
                                        onChange={(e) => setEditForm({ ...editForm, profit_alert_pct: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Loss Alert (%)</label>
                                    <input
                                        type="number"
                                        value={editForm.loss_alert_pct}
                                        onChange={(e) => setEditForm({ ...editForm, loss_alert_pct: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingStock(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={loadingId === editingStock.id}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition"
                            >
                                {loadingId === editingStock.id ? (
                                    <span className="animate-spin">⌛</span>
                                ) : (
                                    <Save size={16} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
