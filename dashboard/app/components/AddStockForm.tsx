'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Loader2 } from 'lucide-react'

export default function AddStockForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        symbol: '',
        atp: '',
        profit: '5.0', // Default
        loss: '5.0'    // Default
    })
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase.from('stocks').insert({
                user_id: user.id,
                symbol: formData.symbol.toUpperCase(),
                buy_price: parseFloat(formData.atp), // Form field matches 'atp' concept, but DB column is 'buy_price'
                profit_alert_pct: parseFloat(formData.profit),
                loss_alert_pct: parseFloat(formData.loss),
                is_active: true
            })

            if (error) throw error

            setFormData({ symbol: '', atp: '', profit: '5.0', loss: '5.0' })
            setMessage('Stock added successfully!')
            setTimeout(() => setMessage(''), 3000)
            onSuccess() // Refresh list
        } catch (err: any) {
            console.error(err)
            setMessage(`Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add New Stock
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Symbol</label>
                    <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="e.g. RELIANCE"
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition uppercase"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">ATP Price (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.atp}
                            onChange={(e) => setFormData({ ...formData, atp: e.target.value })}
                            placeholder="0.00"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Profit Alert (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.profit}
                            onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                            placeholder="5.0"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Loss Alert (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.loss}
                            onChange={(e) => setFormData({ ...formData, loss: e.target.value })}
                            placeholder="5.0"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                    </div>
                </div>

                {message && (
                    <div className={`text-sm text-center p-2 rounded ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Add Stock'}
                </button>
            </form>
        </div>
    )
}
