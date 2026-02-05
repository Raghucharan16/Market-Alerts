'use client'

import { addStock } from '../actions'
import { useRef } from 'react'
import { Plus } from 'lucide-react'

export default function AddStockForm() {
    const formRef = useRef<HTMLFormElement>(null)

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add New Stock
            </h2>
            <form
                ref={formRef}
                action={async (formData) => {
                    await addStock(formData)
                    formRef.current?.reset()
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Symbol</label>
                    <input
                        type="text"
                        name="symbol"
                        placeholder="e.g. Tata Steel Ltd"
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">ATP Price (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="atp"
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
                            name="profit"
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
                            name="loss"
                            placeholder="2.0"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex justify-center items-center gap-2"
                >
                    Add Stock
                </button>
            </form>
        </div>
    )
}
