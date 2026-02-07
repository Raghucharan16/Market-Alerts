'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function AcknowledgeContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!id) {
            setStatus('error')
            setMessage('Invalid Alert ID')
            return
        }

        const acknowledge = async () => {
            try {
                const { error } = await supabase
                    .from('alerts')
                    .update({
                        is_acknowledged: true,
                        acknowledged_at: new Date().toISOString()
                    })
                    .eq('id', id)

                if (error) throw error

                setStatus('success')
            } catch (err: any) {
                console.error('Error acknowledging:', err)
                setStatus('error')
                // Check if error is RLS related (401/403)
                if (err.code === '42501' || err.message?.includes('policy')) {
                    setMessage('You must be logged in to acknowledge alerts.')
                } else {
                    setMessage(err.message || 'Failed to acknowledge alert.')
                }
            }
        }

        acknowledge()
    }, [id])

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">Acknowledging Alert...</p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center max-w-md border border-red-100">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <a href="/" className="inline-block px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
            <div className="p-8 bg-white rounded-lg shadow-lg text-center max-w-md border border-green-100">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-600 mb-2">Alert Acknowledged!</h1>
                <p className="text-gray-600 mb-6">
                    You won't receive further notifications for this specific alert until the condition changes.
                </p>
                <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Go to Dashboard
                </a>
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
            <AcknowledgeContent />
        </Suspense>
    )
}
