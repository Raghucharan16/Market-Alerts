'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Mail, Lock, User, Webhook } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        discordWebhook: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            discord_webhook: formData.discordWebhook
                        }
                    }
                })
                if (error) throw error
                setMessage('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                })
                if (error) throw error
                router.push('/')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {mode === 'login'
                            ? 'Welcome back! Manage your alerts.'
                            : 'Start getting real-time market alerts.'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {mode === 'signup' && (
                            <>
                                <div className="relative mb-4">
                                    <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Full Name"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="relative mb-4">
                                    <Webhook className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                    <input
                                        name="webhook"
                                        type="url"
                                        required
                                        pattern="https://discord.com/api/webhooks/.*"
                                        title="Must be a valid Discord Webhook URL"
                                        className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Discord Webhook URL"
                                        value={formData.discordWebhook}
                                        onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="relative mb-4">
                            <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 ${mode === 'login' ? 'rounded-t-md' : ''} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-green-500 text-sm text-center bg-green-50 p-2 rounded">
                            {message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (mode === 'login' ? 'Sign in' : 'Sign up')}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login')
                                setError(null)
                                setMessage(null)
                            }}
                        >
                            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
