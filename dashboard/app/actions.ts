'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function addStock(formData: FormData) {
    const symbol = formData.get('symbol') as string
    const atp = parseFloat(formData.get('atp') as string)
    const profit = parseFloat(formData.get('profit') as string)
    const loss = parseFloat(formData.get('loss') as string)

    if (!symbol || isNaN(atp) || isNaN(profit) || isNaN(loss)) {
        return { error: 'Invalid input' }
    }

    const { error } = await supabase.from('stocks').insert({
        symbol,
        atp_price: atp,
        profit_threshold: profit,
        loss_threshold: loss,
        is_active: true
    })

    if (error) {
        console.error('Error adding stock:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function deleteStock(id: number) {
    const { error } = await supabase.from('stocks').delete().eq('id', id)

    if (error) {
        console.error('Error deleting stock:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function toggleStockStatus(id: number, currentStatus: boolean) {
    const { error } = await supabase.from('stocks').update({ is_active: !currentStatus }).eq('id', id)

    if (error) {
        console.error('Error toggling stock:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}
