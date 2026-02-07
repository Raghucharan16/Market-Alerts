'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AddStockForm from './components/AddStockForm'
import StockList from './components/StockList'
import { Loader2, LogOut, TrendingUp } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stocks, setStocks] = useState<any[]>([])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchStocks()
      }
    } catch (e) {
      console.error(e)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStocks(data || [])
    } catch (error) {
      console.error('Error fetching stocks:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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

  if (!user) return null

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Market Alerts
            </h1>
            <p className="text-gray-400 mt-1">
              Welcome, {user.user_metadata?.full_name || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-gray-500 hidden sm:block">
              <p>Scraper Status: <span className="text-emerald-500">Active</span></p>
            </div>
            <button
              onClick={() => router.push('/alerts')}
              className="mr-2 flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 rounded-md transition border border-emerald-500/20"
            >
              <TrendingUp size={16} />
              View Alerts
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <AddStockForm onSuccess={fetchStocks} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Active Monitors</h2>
            <StockList stocks={stocks} onUpdate={fetchStocks} />
          </div>
        </div>
      </div>
    </main>
  )
}
