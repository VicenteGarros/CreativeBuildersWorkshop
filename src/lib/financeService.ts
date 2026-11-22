import { supabase } from '@/lib/supabase'
import type { CardItem, GoalItem, Transaction } from '@/App'

// ==========================================
// TRANSAÇÕES
// ==========================================
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar transações do Supabase:', error)
      return []
    }

    return (data || []).map(row => ({
      id: Number(row.id),
      name: row.name,
      category: row.category,
      date: row.date,
      amount: Number(row.amount),
      icon: row.icon || 'cfe5b.svg',
      incoming: Boolean(row.incoming),
      paymentMethod: row.payment_method,
      installments: row.installments,
    }))
  } catch (err) {
    console.error('Falha de conexão com Supabase:', err)
    return []
  }
}

export async function createTransaction(item: Omit<Transaction, 'id'>): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          name: item.name,
          category: item.category,
          date: item.date,
          amount: item.amount,
          icon: item.icon,
          incoming: item.incoming || false,
          payment_method: item.paymentMethod,
          installments: item.installments,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar transação no Supabase:', error)
      return null
    }

    return {
      id: Number(data.id),
      name: data.name,
      category: data.category,
      date: data.date,
      amount: Number(data.amount),
      icon: data.icon,
      incoming: Boolean(data.incoming),
      paymentMethod: data.payment_method,
      installments: data.installments,
    }
  } catch (err) {
    console.error('Falha ao inserir transação:', err)
    return null
  }
}

export async function deleteTransaction(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      console.error('Erro ao deletar transação:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha ao deletar transação:', err)
    return false
  }
}

// ==========================================
// CARTÕES
// ==========================================
export async function getCards(): Promise<CardItem[]> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cartões:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      end: row.last_digits,
      bill: Number(row.bill),
      limit: Number(row.limit_amount),
      closingDay: Number(row.closing_day),
      dueDay: Number(row.due_day),
      dueText: row.due_text || `Vence dia ${row.due_day}`,
      className: row.class_name || 'lime-card',
      cardholder: row.cardholder || 'LUCAS SILVA',
      brand: row.brand || 'Mastercard',
    }))
  } catch (err) {
    console.error('Falha ao buscar cartões:', err)
    return []
  }
}

export async function createCard(card: CardItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('cards').insert([
      {
        id: card.id,
        name: card.name,
        last_digits: card.end,
        bill: card.bill,
        limit_amount: card.limit,
        closing_day: card.closingDay,
        due_day: card.dueDay,
        due_text: card.dueText,
        class_name: card.className,
        cardholder: card.cardholder,
        brand: card.brand,
      },
    ])

    if (error) {
      console.error('Erro ao salvar cartão:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha ao criar cartão:', err)
    return false
  }
}

export async function updateCardBill(cardId: string, newBill: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('cards').update({ bill: newBill }).eq('id', cardId)
    if (error) {
      console.error('Erro ao atualizar fatura do cartão:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha ao atualizar fatura:', err)
    return false
  }
}

// ==========================================
// METAS E OBJETIVOS
// ==========================================
export async function getGoals(): Promise<GoalItem[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar metas:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      category: row.category,
      targetDate: row.target_date,
      isLongTerm: Boolean(row.is_long_term),
    }))
  } catch (err) {
    console.error('Falha ao buscar metas:', err)
    return []
  }
}

export async function createGoal(goal: GoalItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('goals').insert([
      {
        id: goal.id,
        title: goal.title,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        category: goal.category,
        target_date: goal.targetDate,
        is_long_term: goal.isLongTerm || false,
      },
    ])

    if (error) {
      console.error('Erro ao criar meta:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha ao criar meta:', err)
    return false
  }
}

export async function updateGoalAmount(goalId: string, newAmount: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId)
    if (error) {
      console.error('Erro ao atualizar valor da meta:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha ao atualizar meta:', err)
    return false
  }
}
