import { createClient } from '@supabase/supabase-js'
import AddStockForm from './components/AddStockForm'
import StockList from './components/StockList'

// We need a server-side client for fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Market Alerts
            </h1>
            <p className="text-gray-400 mt-1">
              Automated tracking & email alerts
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Scraper Status: <span className="text-emerald-500">Scheduled via Actions</span></p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <AddStockForm />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-white">Active Monitors</h2>
            <StockList stocks={stocks || []} />
          </div>
        </div>
      </div>
    </main>
  )
}
