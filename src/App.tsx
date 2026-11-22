import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  getTransactions,
  createTransaction,
  deleteTransaction as deleteTransactionApi,
  getCards,
  createCard as createCardApi,
  updateCardBill,
  getGoals,
  createGoal as createGoalApi,
  updateGoalAmount,
} from '@/lib/financeService'
import {
  ADMIN_CREDENTIALS,
  AppUser,
  getCurrentSessionUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/authService'

const A = '/assets'

export type View = 'home' | 'report' | 'cards' | 'invoice' | 'goals'
export type AuthMode = 'login' | 'register'

export type Transaction = {
  id: number
  name: string
  category: string
  date: string
  amount: number
  icon: string
  incoming?: boolean
  installments?: string
  paymentMethod?: string
}

export type CardItem = {
  id: string
  name: string
  end: string
  bill: number
  limit: number
  closingDay: number
  dueDay: number
  dueText: string
  className: string
  cardholder: string
  brand: string
}

export type GoalItem = {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  category: string
  targetDate: string
  isLongTerm?: boolean
}

const initialCards: CardItem[] = [
  {
    id: 'c1',
    name: 'Principal Eskgo',
    end: '4552',
    bill: 1284.5,
    limit: 5000,
    closingDay: 13,
    dueDay: 21,
    dueText: 'Em 8 dias (21/Nov)',
    className: 'lime-card',
    cardholder: 'LUCAS SILVA',
    brand: 'Mastercard Black',
  },
  {
    id: 'c2',
    name: 'Conta Salário',
    end: '6917',
    bill: 640.0,
    limit: 2500,
    closingDay: 25,
    dueDay: 5,
    dueText: 'Em 12 dias (05/Dez)',
    className: 'lilac-card',
    cardholder: 'LUCAS SILVA',
    brand: 'Visa Platinum',
  },
  {
    id: 'c3',
    name: 'Viagem & Lazer',
    end: '1180',
    bill: 98.2,
    limit: 4000,
    closingDay: 10,
    dueDay: 18,
    dueText: 'Em 27 dias (18/Dez)',
    className: 'black-card',
    cardholder: 'LUCAS SILVA',
    brand: 'Eskgo Global',
  },
]

const initialTransactions: Transaction[] = [
  { id: 1, name: 'Mercado Central', category: '#mercado', date: '21.11.2026', amount: 86.4, icon: 'cfe5b.svg', paymentMethod: 'Crédito Principal' },
  { id: 2, name: 'Ônibus Metropolitano', category: '#transporte', date: '21.11.2026', amount: 4.5, icon: '29ff1.svg', paymentMethod: 'Débito' },
  { id: 3, name: 'Café com Ana', category: '#lazer', date: '20.11.2026', amount: 18, icon: '884f7.svg', paymentMethod: 'Crédito Principal' },
  { id: 4, name: 'Freela UI Design', category: '#entrada', date: '20.11.2026', amount: 450, icon: '1fc95.svg', incoming: true, paymentMethod: 'Pix' },
  { id: 5, name: 'Supermercado Mensal', category: '#mercado', date: '19.11.2026', amount: 412.3, icon: 'cfe5b.svg', installments: '1/3', paymentMethod: 'Crédito Principal' },
  { id: 6, name: 'Assinatura Spotify & Netflix', category: '#contas', date: '17.11.2026', amount: 79.9, icon: '362d5.svg', installments: 'Recorrente', paymentMethod: 'Crédito Principal' },
  { id: 7, name: 'Jantar Restaurante Tokyo', category: '#lazer', date: '15.11.2026', amount: 198.0, icon: '884f7.svg', paymentMethod: 'Crédito Principal' },
  { id: 8, name: 'Farmácia DrogaRaia', category: '#saúde', date: '14.11.2026', amount: 64.9, icon: '021f6.svg', paymentMethod: 'Crédito Principal' },
]

const initialGoals: GoalItem[] = [
  { id: 'g1', title: 'Viagem ao Japão', targetAmount: 20000, currentAmount: 13600, category: 'Viagem', targetDate: 'Dez 2027', isLongTerm: true },
  { id: 'g2', title: 'Reserva de Emergência', targetAmount: 18000, currentAmount: 12960, category: 'Segurança', targetDate: 'Jun 2027', isLongTerm: false },
  { id: 'g3', title: 'Curso Especialização IA', targetAmount: 3500, currentAmount: 3150, category: 'Educação', targetDate: 'Fev 2027', isLongTerm: false },
  { id: 'g4', title: 'Troca de Carro Novo', targetAmount: 45000, currentAmount: 10800, category: 'Bens', targetDate: 'Jul 2028', isLongTerm: true },
]

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const navItems: { view: View; label: string; icon: string }[] = [
  { view: 'home', label: 'Início', icon: 'nav/home.svg' },
  { view: 'cards', label: 'Cartões', icon: 'nav/cards.svg' },
  { view: 'invoice', label: 'Fatura', icon: 'nav/invoice.svg' },
  { view: 'report', label: 'Relatório', icon: 'nav/report.svg' },
  { view: 'goals', label: 'Metas', icon: 'nav/goals.svg' },
]

function IconButton({ src, label, onClick }: { src: string; label: string; onClick?: () => void }) {
  return (
    <button className="icon-button" aria-label={label} onClick={onClick}>
      <img src={`${A}/${src}`} alt="" />
    </button>
  )
}

function Header({
  title,
  subtitle = 'Olá, Lucas',
  onAccount,
  actionButton,
}: {
  title: string
  subtitle?: string
  onAccount: () => void
  actionButton?: React.ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{subtitle}</span>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {actionButton}
        <button className="avatar-button" onClick={onAccount} aria-label="Abrir conta">
          <span>LS</span>
        </button>
      </div>
    </header>
  )
}

function TransactionRow({ item, onOpen }: { item: Transaction; onOpen?: () => void }) {
  return (
    <button className="transaction" onClick={onOpen}>
      <span className="transaction-icon">
        <img src={`${A}/${item.icon}`} alt="" />
      </span>
      <span className="transaction-copy">
        <strong>{item.name}</strong>
        <small>
          {item.category} · {item.date} {item.installments ? `· (${item.installments})` : ''}
        </small>
      </span>
      <strong className={`transaction-value ${item.incoming ? 'incoming' : ''}`}>
        {item.incoming ? '+' : '−'} {money(item.amount)}
      </strong>
    </button>
  )
}

function BudgetCard({ spent }: { spent: number }) {
  const total = 3200
  const remaining = Math.max(total - spent, 0)
  const progress = Math.min((spent / total) * 100, 100)
  return (
    <section className="budget-card">
      <div className="row-between">
        <strong>Orçamento de novembro</strong>
        <span>{money(spent)} / {money(total)}</span>
      </div>
      <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      <p><mark>Restam {money(remaining)}</mark> para os próximos 20 dias</p>
    </section>
  )
}

// ==========================================
// TELA: LOGIN E CADASTRO SEGURO (ADMIN TESTE + REGISTRO)
// ==========================================
function AuthScreen({
  mode,
  setMode,
  onLoginSuccess,
}: {
  mode: AuthMode
  setMode: (m: AuthMode) => void
  onLoginSuccess: (user: AppUser) => void
}) {
  const isLogin = mode === 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(ADMIN_CREDENTIALS.email)
  const [password, setPassword] = useState(ADMIN_CREDENTIALS.password)
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    try {
      if (isLogin) {
        const res = await loginUser(email, password)
        if (res.success && res.user) {
          onLoginSuccess(res.user)
        } else {
          setErrorMsg(res.message || 'Falha ao autenticar.')
        }
      } else {
        const res = await registerUser(fullName, email, password)
        if (res.success && res.user) {
          onLoginSuccess(res.user)
        } else {
          setErrorMsg(res.message || 'Falha ao criar conta.')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          eskgo<span>.</span>
        </div>
        <h2>{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta no Eskgo'}</h2>
        <p className="auth-desc">
          {isLogin
            ? 'Acesse seu painel financeiro completo com seu login e senha.'
            : 'Preencha seus dados para criar seu acesso seguro no Eskgo.'}
        </p>

        {errorMsg && (
          <div className="auth-error-notice" style={{ marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="auth-field">
              <span>Nome completo</span>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seuemail@gmail.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha secreta"
              required
            />
          </label>

          {isLogin && (
            <div className="auth-extra-row">
              <label className="auth-remember">
                <input type="checkbox" defaultChecked />
                <span>Lembrar meu acesso</span>
              </label>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setEmail(ADMIN_CREDENTIALS.email)
                  setPassword(ADMIN_CREDENTIALS.password)
                }}
              >
                Preencher Admin Teste
              </button>
            </div>
          )}

          <button className="primary-button auth-submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Autenticando...' : isLogin ? 'Entrar no Eskgo →' : 'Criar minha conta →'}
          </button>

          {isLogin && (
            <div className="auth-notice">
              🛡️ <strong>Usuário Administrador de Teste:</strong>
              <br />
              <strong>E-mail:</strong> {ADMIN_CREDENTIALS.email} | <strong>Senha:</strong> {ADMIN_CREDENTIALS.password}
              <br />
              <small>Outros usuários devem se cadastrar na opção abaixo.</small>
            </div>
          )}

          <div className="auth-switch">
            {isLogin ? (
              <p>
                Não tem uma conta ainda?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setErrorMsg('')
                    setEmail('')
                    setPassword('')
                  }}
                >
                  Cadastre-se grátis
                </button>
              </p>
            ) : (
              <p>
                Já tem uma conta no Eskgo?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErrorMsg('')
                    setEmail(ADMIN_CREDENTIALS.email)
                    setPassword(ADMIN_CREDENTIALS.password)
                  }}
                >
                  Faça login
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

// ==========================================
// TELA: INÍCIO (HOME)
// ==========================================
function Home({
  hidden,
  setHidden,
  spent,
  transactions,
  onAdd,
  onReport,
  onAccount,
  onTransaction,
  onGoToCards,
}: {
  hidden: boolean
  setHidden: (value: boolean) => void
  spent: number
  transactions: Transaction[]
  onAdd: () => void
  onReport: () => void
  onAccount: () => void
  onTransaction: (item: Transaction) => void
  onGoToCards: () => void
}) {
  return (
    <main className="page home-page">
      <Header title="Início" onAccount={onAccount} />
      <div className="home-grid">
        <section className="balance-panel">
          <div className="illustration">
            <img src={`${A}/c21fe.png`} alt="Pessoa conferindo as finanças pelo celular" />
          </div>
          <div className="balance-copy">
            <span>Saldo disponível no mês</span>
            <strong>{hidden ? 'R$ •••••' : 'R$ 14.500'}</strong>
            <div className="balance-actions-row">
              <button className="text-action" onClick={() => setHidden(!hidden)}>
                <img className="border-radius-16px" src={`${A}/845d8.svg`} alt="" />
                {hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              </button>
              <button className="card-quick-pill" onClick={onGoToCards}>
                3 cartões ativos
              </button>
            </div>
          </div>
        </section>

        <section className="home-actions">
          <BudgetCard spent={spent} />
          <div className="quick-actions">
            <button className="primary-button" onClick={onAdd}><span>＋</span> Novo gasto</button>
            <button className="outline-button" onClick={onReport}>Ver relatório mensal</button>
          </div>
        </section>

        <section className="transactions-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Movimentações recentes</span>
              <h2>Últimos gastos</h2>
            </div>
            <button onClick={onReport}>Ver tudo</button>
          </div>
          <div className="transaction-list">
            {transactions.slice(0, 6).map(item => (
              <TransactionRow key={item.id} item={item} onOpen={() => onTransaction(item)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

// ==========================================
// TELA: CARTÕES (GESTÃO DE LIMITES E CARTEIRA)
// ==========================================
function Cards({
  cards,
  activeCardIndex,
  setActiveCardIndex,
  onAccount,
  onGoToInvoice,
  onNewCard,
}: {
  cards: CardItem[]
  activeCardIndex: number
  setActiveCardIndex: (index: number) => void
  onAccount: () => void
  onGoToInvoice: () => void
  onNewCard: () => void
}) {
  const currentCard = cards[activeCardIndex] || cards[0]
  const limitUsedPercent = Math.min(Math.round((currentCard.bill / currentCard.limit) * 100), 100)
  const availableLimit = Math.max(currentCard.limit - currentCard.bill, 0)

  return (
    <main className="page cards-page">
      <Header
        title="Cartões"
        onAccount={onAccount}
        actionButton={
          <button className="pill-action-btn" onClick={onNewCard}>
            ＋ Novo Cartão
          </button>
        }
      />
      <div className="cards-layout">
        <section className="wallet-section">
          <span className="eyebrow">Selecione o cartão para gerenciar</span>
          <div className="wallet-stack" aria-label="Carteira de cartões">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => setActiveCardIndex(index)}
                className={`credit-card ${card.className} ${index === activeCardIndex ? 'active' : ''}`}
                style={{ '--card-index': index } as React.CSSProperties}
              >
                <div className="card-top-row">
                  <span>eskgo</span>
                  <span className="card-brand-tag">{card.brand}</span>
                </div>
                <div className="card-mid-info">
                  <strong>{card.name}</strong>
                  <span className="card-holder-name">{card.cardholder}</span>
                </div>
                <div className="card-bottom-row">
                  <small>•••• •••• •••• {card.end}</small>
                  <small>Venc: {card.dueDay}</small>
                </div>
              </button>
            ))}
          </div>
          <p className="wallet-hint">Dica: clique em um cartão acima para ver faturas e limites.</p>
        </section>

        <section className="card-details">
          <div className="card-details-header">
            <div>
              <span className="eyebrow">Cartão selecionado</span>
              <h2>{currentCard.name}</h2>
            </div>
            <span className="card-chip-tag">•• {currentCard.end}</span>
          </div>

          <div className="bill-highlight-box">
            <span className="eyebrow">Fatura atual em aberto</span>
            <strong className="bill-value">{money(currentCard.bill)}</strong>
            <p>Fechamento dia {currentCard.closingDay} · Vencimento dia {currentCard.dueDay}</p>
          </div>

          <div className="limit-breakdown">
            <div className="row-between">
              <span>Limite total</span>
              <b>{money(currentCard.limit)}</b>
            </div>
            <div className="row-between">
              <span>Limite utilizado ({limitUsedPercent}%)</span>
              <b className="spent-text">{money(currentCard.bill)}</b>
            </div>
            <div className="progress-track">
              <i style={{ width: `${limitUsedPercent}%` }} />
            </div>
            <div className="row-between available-row">
              <span>Disponível para compras</span>
              <strong className="lime-text">{money(availableLimit)}</strong>
            </div>
          </div>

          <div className="due-box">
            <div>
              <span>Status do Vencimento</span>
              <strong>{currentCard.dueText}</strong>
            </div>
            <span className="status-pill open">Aberta</span>
          </div>

          <div className="card-actions-grid">
            <button className="primary-button" onClick={onGoToInvoice}>
              Ver Detalhes da Fatura →
            </button>
            <button className="outline-button" onClick={onNewCard}>
              ＋ Adicionar outro cartão
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

// ==========================================
// TELA: FATURA DETALHADA DO CARTÃO
// ==========================================
function InvoicePage({
  cards,
  activeCardIndex,
  transactions,
  onAccount,
  onPayInvoice,
  onBackToCards,
}: {
  cards: CardItem[]
  activeCardIndex: number
  transactions: Transaction[]
  onAccount: () => void
  onPayInvoice: () => void
  onBackToCards: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'installments' | 'recurrent'>('all')
  const currentCard = cards[activeCardIndex] || cards[0]
  const cardTransactions = transactions.filter(t => !t.incoming)

  const filteredTransactions = useMemo(() => {
    if (filter === 'installments') return cardTransactions.filter(t => Boolean(t.installments && t.installments !== 'Recorrente'))
    if (filter === 'recurrent') return cardTransactions.filter(t => t.installments === 'Recorrente')
    return cardTransactions
  }, [cardTransactions, filter])

  return (
    <main className="page invoice-page">
      <Header
        title="Fatura Detalhada"
        subtitle={`Cartão ${currentCard.name} (•• ${currentCard.end})`}
        onAccount={onAccount}
        actionButton={
          <button className="pill-action-btn secondary" onClick={onBackToCards}>
            ← Trocar Cartão
          </button>
        }
      />

      <div className="invoice-grid">
        <section className="invoice-summary-card">
          <div className="invoice-top-status">
            <div>
              <span className="eyebrow">Mês de Referência</span>
              <h2>Novembro 2026</h2>
            </div>
            <span className="status-pill open">Fatura Aberta</span>
          </div>

          <div className="invoice-amount-block">
            <span className="eyebrow">Valor total da fatura</span>
            <strong className="invoice-total">{money(currentCard.bill)}</strong>
            <p className="invoice-dates-info">
              Fecha em <strong>{currentCard.closingDay} de nov</strong> · Vence em <strong>{currentCard.dueDay} de nov</strong> ({currentCard.dueText})
            </p>
          </div>

          <div className="invoice-meta-grid">
            <div className="meta-box">
              <span>Limite Utilizado</span>
              <strong>{money(currentCard.bill)}</strong>
            </div>
            <div className="meta-box">
              <span>Limite Disponível</span>
              <strong>{money(Math.max(currentCard.limit - currentCard.bill, 0))}</strong>
            </div>
            <div className="meta-box">
              <span>Melhor dia de compra</span>
              <strong>Dia {currentCard.closingDay + 1}</strong>
            </div>
          </div>

          <div className="invoice-pay-actions">
            <button className="primary-button pay-btn" onClick={onPayInvoice}>
              Pagar Fatura Antecipada (Pix / Boleto)
            </button>
            <div className="invoice-helpers">
              <span>📄 Código de barras gerado</span>
              <span>⚡ Liberação de limite instantânea</span>
            </div>
          </div>
        </section>

        <section className="invoice-items-card">
          <div className="invoice-items-header">
            <div>
              <span className="eyebrow">Lançamentos na Fatura</span>
              <h2>Compras neste ciclo</h2>
            </div>
            <div className="filter-chips">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button>
              <button className={filter === 'installments' ? 'active' : ''} onClick={() => setFilter('installments')}>Parceladas</button>
              <button className={filter === 'recurrent' ? 'active' : ''} onClick={() => setFilter('recurrent')}>Fixas</button>
            </div>
          </div>

          <div className="invoice-list">
            {filteredTransactions.map(item => (
              <div className="invoice-row" key={item.id}>
                <div className="invoice-row-left">
                  <span className="transaction-icon">
                    <img src={`${A}/${item.icon}`} alt="" />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.category} · {item.date} {item.installments ? `· Parcela ${item.installments}` : '· À vista'}
                    </small>
                  </div>
                </div>
                <strong className="invoice-item-value">− {money(item.amount)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

// ==========================================
// TELA: OBJETIVOS E METAS FINANCEIRAS
// ==========================================
function Goals({
  goals,
  onAccount,
  onToast,
  onAddAmount,
  onNewGoal,
}: {
  goals: GoalItem[]
  onAccount: () => void
  onToast: (message: string) => void
  onAddAmount: (goalId: string, amount: number) => void
  onNewGoal: () => void
}) {
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || 'g1')
  const currentGoal = goals.find(g => g.id === selectedGoalId) || goals[0]

  const monthlyBudgetCategories = [
    { name: 'Alimentação & Mercado', spent: 1240, total: 1500, percent: 82 },
    { name: 'Moradia & Contas', spent: 900, total: 900, percent: 100 },
    { name: 'Transporte & Mobilidade', spent: 160, total: 400, percent: 40 },
    { name: 'Lazer & Restaurantes', spent: 390, total: 500, percent: 78 },
  ]

  const currentPercent = Math.min(Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100), 100)
  const remainingToGoal = Math.max(currentGoal.targetAmount - currentGoal.currentAmount, 0)

  return (
    <main className="page goals-page">
      <Header
        title="Objetivos & Metas"
        onAccount={onAccount}
        actionButton={
          <button className="pill-action-btn" onClick={onNewGoal}>
            ＋ Nova Meta
          </button>
        }
      />

      <div className="goals-layout">
        <section className="saving-goals">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Meta Selecionada</span>
              <h2>{currentGoal.title}</h2>
            </div>
            <span className="goal-date-tag">Previsão: {currentGoal.targetDate}</span>
          </div>

          <div className="goal-main-display">
            <span className="eyebrow">Valor acumulado até o momento</span>
            <strong className="big-number">{money(currentGoal.currentAmount)}</strong>
            <div className="row-between">
              <span>Progresso da meta ({currentPercent}%)</span>
              <b>Alvo: {money(currentGoal.targetAmount)}</b>
            </div>
            <div className="progress-track lime">
              <i style={{ width: `${currentPercent}%` }} />
            </div>
            <p className="remaining-goal-hint">
              Faltam apenas <strong>{money(remainingToGoal)}</strong> para conquistar este objetivo!
            </p>
          </div>

          <div className="goal-deposit-actions">
            <button
              className="primary-button"
              onClick={() => {
                onAddAmount(currentGoal.id, 500)
                onToast(`+ R$ 500 guardados em "${currentGoal.title}"!`)
              }}
            >
              Guardar + R$ 500 nesta meta
            </button>
            <div className="deposit-preset-chips">
              <button onClick={() => { onAddAmount(currentGoal.id, 100); onToast(`+ R$ 100 em ${currentGoal.title}`) }}>+ R$ 100</button>
              <button onClick={() => { onAddAmount(currentGoal.id, 250); onToast(`+ R$ 250 em ${currentGoal.title}`) }}>+ R$ 250</button>
              <button onClick={() => { onAddAmount(currentGoal.id, 1000); onToast(`+ R$ 1.000 em ${currentGoal.title}`) }}>+ R$ 1.000</button>
            </div>
          </div>

          <div className="mini-goals-section">
            <span className="eyebrow">Todas as suas metas ativas</span>
            <div className="mini-goals-list">
              {goals.map(item => {
                const pct = Math.min(Math.round((item.currentAmount / item.targetAmount) * 100), 100)
                const isSelected = item.id === currentGoal.id
                return (
                  <button
                    key={item.id}
                    className={`mini-goal-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedGoalId(item.id)}
                  >
                    <div className="mini-goal-info">
                      <strong>{item.title}</strong>
                      <small>{item.category} · Alvo: {money(item.targetAmount)}</small>
                    </div>
                    <div className="mini-goal-progress">
                      <strong>{pct}%</strong>
                      <span>{money(item.currentAmount)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="monthly-budget">
          <span className="eyebrow">Teto de Gastos Mensal</span>
          <h2>Orçamento por Categorias</h2>
          <strong className="big-number">R$ 860</strong>
          <p>Disponível do teto total de R$ 3.200 neste mês</p>

          <div className="goal-grid">
            {monthlyBudgetCategories.map(cat => (
              <div className="goal-tile" key={cat.name}>
                <div className="goal-tile-header">
                  <span>{cat.name}</span>
                  <strong>{cat.percent}%</strong>
                </div>
                <div className="category-track">
                  <i style={{ width: `${cat.percent}%` }} />
                </div>
                <small className="tile-footer-info">
                  {money(cat.spent)} de {money(cat.total)}
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

// ==========================================
// TELA: RELATÓRIO FINANCEIRO
// ==========================================
const reportCategories = [
  ['#mercado', 'R$ 280 · 42%', 42, true],
  ['#lazer', 'R$ 165 · 25%', 25, false],
  ['#transporte', 'R$ 120 · 18%', 18, false],
  ['#contas', 'R$ 100 · 15%', 15, false],
] as const

function Report({ onAccount }: { onAccount: () => void }) {
  const [period, setPeriod] = useState('Semana')
  return (
    <main className="page report-page">
      <Header title="Relatório" onAccount={onAccount} />
      <div className="report-grid">
        <section className="report-summary">
          <div className="segmented">
            {['Semana', 'Mês', 'Ano'].map(item => (
              <button className={period === item ? 'active' : ''} onClick={() => setPeriod(item)} key={item}>{item}</button>
            ))}
          </div>
          <div className="date-range">‹ <span>Gastos · 15 a 21 de novembro</span> ›</div>
          <strong className="report-total">− R$ 665</strong>
          <div className="entry-toggle"><strong>Entradas R$ 450</strong><span>Gastos R$ 665</span></div>
        </section>

        <section className="chart-card">
          <h2>Evolução diária</h2>
          <div className="bars">
            {[38, 93, 2, 170, 30, 118, 72].map((height, index) => (
              <div className="bar-column" key={index}>
                <i className={index === 3 ? 'selected' : ''} style={{ height }} />
                <span>{15 + index}</span>
              </div>
            ))}
            <div className="average-line"><span>Média R$ 95</span></div>
          </div>
        </section>

        <section className="category-card">
          <h2>Por categoria</h2>
          {reportCategories.map(([name, value, width, lime]) => (
            <div className="category-row" key={name}>
              <div><strong>{name}</strong><strong>{value}</strong></div>
              <div className="category-track"><i className={lime ? 'lime' : ''} style={{ width: `${width}%` }} /></div>
            </div>
          ))}
        </section>

        <section className="report-transactions">
          <div className="section-heading"><h2>Transações do Período</h2></div>
          <TransactionRow item={{ id: 8, name: 'Supermercado Central', category: '#mercado', date: '18.11.2026', amount: 115, icon: '021f6.svg' }} />
          <TransactionRow item={{ id: 9, name: 'Conta de luz Enel', category: '#contas', date: '18.11.2026', amount: 100, icon: '362d5.svg' }} />
        </section>
      </div>
    </main>
  )
}

// ==========================================
// BARRA DE NAVEGAÇÃO
// ==========================================
function Navigation({ view, setView }: { view: View; setView: (view: View) => void }) {
  return (
    <nav className="app-nav" aria-label="Navegação principal">
      <div className="brand">eskgo<span>.</span></div>
      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.view}
            className={view === item.view ? 'active' : ''}
            onClick={() => setView(item.view)}
          >
            <img src={`${A}/${item.icon}`} alt="" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// ==========================================
// MODAL: NOVO GASTO
// ==========================================
function AddExpense({ onClose, onSave }: { onClose: () => void; onSave: (item: Transaction) => void }) {
  const [rawValue, setRawValue] = useState('45,90')
  const [category, setCategory] = useState('#mercado')
  const [memo, setMemo] = useState('Lanche na padaria')
  const [paymentMethod, setPaymentMethod] = useState('Crédito Principal')
  const [recurring, setRecurring] = useState(false)
  const categories = ['#mercado', '#transporte', '#lazer', '#contas', '#saúde', '#educação']

  function submit(event: FormEvent) {
    event.preventDefault()
    const amount = Number(rawValue.replace(/\./g, '').replace(',', '.'))
    if (!amount) return
    onSave({
      id: Date.now(),
      name: memo || 'Novo gasto',
      category,
      date: 'Hoje, 21 nov',
      amount,
      icon: 'cfe5b.svg',
      paymentMethod,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="expense-sheet" onSubmit={submit} onMouseDown={event => event.stopPropagation()}>
        <div className="sheet-header">
          <h2>Novo gasto</h2>
          <IconButton src="72cd3.svg" label="Fechar" onClick={onClose} />
        </div>
        <label className="value-field">
          <span>Valor da despesa</span>
          <div>
            <b>R$</b>
            <input value={rawValue} onChange={e => setRawValue(e.target.value)} inputMode="decimal" autoFocus />
          </div>
        </label>
        <fieldset>
          <legend>Categoria</legend>
          <div className="category-chips">
            {categories.map(item => (
              <button
                type="button"
                className={category === item ? 'selected' : ''}
                onClick={() => setCategory(item)}
                key={item}
              >
                {category === item && '✓ '}
                {item}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="field-pair">
          <label>
            <span>Data</span>
            <select><option>Hoje, 21 nov</option><option>Ontem, 20 nov</option></select>
          </label>
          <label>
            <span>Pago com</span>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="Crédito Principal">Crédito Principal (•• 4552)</option>
              <option value="Conta Salário">Conta Salário (•• 6917)</option>
              <option value="Cartão Viagem">Cartão Viagem (•• 1180)</option>
              <option value="Pix">Pix / Saldo</option>
            </select>
          </label>
        </div>
        <label className="memo-field">
          <span>Descrição ou #hashtag</span>
          <input maxLength={100} value={memo} onChange={e => setMemo(e.target.value)} />
          <small>{memo.length} / 100</small>
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
          <span>Gasto recorrente, todo mês</span>
        </label>
        <button className="primary-button save-button" type="submit">Salvar gasto</button>
      </form>
    </div>
  )
}

// ==========================================
// MODAL: NOVO CARTÃO
// ==========================================
function NewCardModal({ onClose, onSave }: { onClose: () => void; onSave: (card: CardItem) => void }) {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('3.500')
  const [end, setEnd] = useState('')
  const [closingDay, setClosingDay] = useState(15)
  const [dueDay, setDueDay] = useState(22)
  const [cardColor, setCardColor] = useState<'lime-card' | 'lilac-card' | 'black-card'>('lime-card')

  function submit(e: FormEvent) {
    e.preventDefault()
    const cleanLimit = Number(limit.replace(/\./g, '').replace(',', '.')) || 3000
    const cleanEnd = end.slice(-4) || String(Math.floor(1000 + Math.random() * 9000))
    onSave({
      id: `c_${Date.now()}`,
      name: name || 'Novo Cartão Eskgo',
      end: cleanEnd,
      bill: 0,
      limit: cleanLimit,
      closingDay,
      dueDay,
      dueText: `Vence dia ${dueDay}`,
      className: cardColor,
      cardholder: 'LUCAS SILVA',
      brand: 'Mastercard Platinum',
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="expense-sheet" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Adicionar Novo Cartão</h2>
          <IconButton src="72cd3.svg" label="Fechar" onClick={onClose} />
        </div>
        <label className="memo-field">
          <span>Nome ou apelido do cartão</span>
          <input
            placeholder="Ex: Nubank, Cartão Corporativo, Inter"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <div className="field-pair">
          <label>
            <span>Limite total (R$)</span>
            <input
              type="text"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="3500"
              required
            />
          </label>
          <label>
            <span>Últimos 4 dígitos</span>
            <input
              type="text"
              maxLength={4}
              value={end}
              onChange={e => setEnd(e.target.value)}
              placeholder="8821"
            />
          </label>
        </div>
        <div className="field-pair" style={{ marginTop: '14px' }}>
          <label>
            <span>Dia do fechamento</span>
            <input
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={e => setClosingDay(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Dia do vencimento</span>
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={e => setDueDay(Number(e.target.value))}
            />
          </label>
        </div>
        <fieldset>
          <legend>Estilo e Cor do Cartão</legend>
          <div className="color-selector">
            <button
              type="button"
              className={`color-btn lime ${cardColor === 'lime-card' ? 'selected' : ''}`}
              onClick={() => setCardColor('lime-card')}
            >
              Lime Eskgo
            </button>
            <button
              type="button"
              className={`color-btn lilac ${cardColor === 'lilac-card' ? 'selected' : ''}`}
              onClick={() => setCardColor('lilac-card')}
            >
              Lilás Soft
            </button>
            <button
              type="button"
              className={`color-btn dark ${cardColor === 'black-card' ? 'selected' : ''}`}
              onClick={() => setCardColor('black-card')}
            >
              Preto Carbon
            </button>
          </div>
        </fieldset>
        <button className="primary-button save-button" type="submit">Cadastrar Cartão</button>
      </form>
    </div>
  )
}

// ==========================================
// MODAL: NOVO OBJETIVO / META
// ==========================================
function NewGoalModal({ onClose, onSave }: { onClose: () => void; onSave: (goal: GoalItem) => void }) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('5.000')
  const [initialSaved, setInitialSaved] = useState('500')
  const [category, setCategory] = useState('Viagem')
  const [targetDate, setTargetDate] = useState('Dez 2027')

  function submit(e: FormEvent) {
    e.preventDefault()
    const target = Number(targetAmount.replace(/\./g, '').replace(',', '.')) || 5000
    const saved = Number(initialSaved.replace(/\./g, '').replace(',', '.')) || 0
    onSave({
      id: `g_${Date.now()}`,
      title: title || 'Nova Conquista',
      targetAmount: target,
      currentAmount: saved,
      category,
      targetDate,
      isLongTerm: true,
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="expense-sheet" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Novo Objetivo Financeiro</h2>
          <IconButton src="72cd3.svg" label="Fechar" onClick={onClose} />
        </div>
        <label className="memo-field">
          <span>Nome da sua meta</span>
          <input
            placeholder="Ex: Reforma da sala, Intercâmbio, MacBook novo"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
        </label>
        <div className="field-pair">
          <label>
            <span>Valor desejado (R$)</span>
            <input
              type="text"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="10000"
              required
            />
          </label>
          <label>
            <span>Já tenho guardado (R$)</span>
            <input
              type="text"
              value={initialSaved}
              onChange={e => setInitialSaved(e.target.value)}
              placeholder="500"
            />
          </label>
        </div>
        <div className="field-pair" style={{ marginTop: '14px' }}>
          <label>
            <span>Categoria</span>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Viagem">Viagem & Lazer</option>
              <option value="Segurança">Reserva & Segurança</option>
              <option value="Educação">Educação & Cursos</option>
              <option value="Bens">Bens & Compras</option>
              <option value="Família">Família & Futuro</option>
            </select>
          </label>
          <label>
            <span>Previsão de conquista</span>
            <input
              type="text"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              placeholder="Dez 2027"
            />
          </label>
        </div>
        <button className="primary-button save-button" type="submit" style={{ marginTop: '24px' }}>
          Criar Objetivo
        </button>
      </form>
    </div>
  )
}

// ==========================================
// MODAL: CONTA DO USUÁRIO
// ==========================================
function AccountSheet({
  user,
  onClose,
  onLogout,
}: {
  user: AppUser | null
  onClose: () => void
  onLogout: () => void
}) {
  const displayName = user?.fullName || 'Lucas Silva'
  const displayEmail = user?.email || 'lucas@eskgo.com'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'US'

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="account-sheet" onMouseDown={event => event.stopPropagation()}>
        <div className="sheet-header">
          <h2>Sua conta</h2>
          <button className="close-text" onClick={onClose}>Fechar</button>
        </div>
        <div className="account-person">
          <span>{initials}</span>
          <div>
            <strong>
              {displayName}
              {user?.role === 'admin' && <span className="auth-tag">ADMIN</span>}
            </strong>
            <small>{displayEmail}</small>
          </div>
        </div>
        <div className="account-settings-list">
          <label className="switch-row">
            <span>Ocultar saldo ao iniciar</span>
            <input type="checkbox" />
          </label>
          <label className="switch-row">
            <span>Notificações de vencimento</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="switch-row">
            <span>IA Insights (OpenAI Integration)</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
        <button className="logout-button" onClick={onLogout}>
          Sair da conta (Voltar ao Login)
        </button>
      </section>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentSessionUser())
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getCurrentSessionUser())
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [view, setView] = useState<View>('home')
  const [hidden, setHidden] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [cards, setCards] = useState<CardItem[]>(initialCards)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals)

  // Carregar dados reais do Supabase na inicialização
  useEffect(() => {
    async function loadFromSupabase() {
      const [dbTransactions, dbCards, dbGoals] = await Promise.all([
        getTransactions(),
        getCards(),
        getGoals(),
      ])

      if (dbTransactions.length > 0) setTransactions(dbTransactions)
      if (dbCards.length > 0) setCards(dbCards)
      if (dbGoals.length > 0) setGoals(dbGoals)
    }

    loadFromSupabase()
  }, [])

  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [newCardOpen, setNewCardOpen] = useState(false)
  const [newGoalOpen, setNewGoalOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [toast, setToast] = useState('')

  const spent = useMemo(() => {
    return 2340 + transactions.filter(t => !t.incoming).reduce((sum, item) => sum + item.amount, 0)
  }, [transactions])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    notify(`Bem-vindo, ${user.fullName}!${user.role === 'admin' ? ' (Modo Admin)' : ''}`)
  }

  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setAccountOpen(false)
    notify('Você saiu da sua conta.')
  }

  const saveExpense = async (item: Transaction) => {
    // Atualização otimista na tela
    setTransactions(current => [item, ...current])
    setAddExpenseOpen(false)
    notify('Gasto registrado com sucesso!')

    // Persistência no Supabase
    const saved = await createTransaction({
      name: item.name,
      category: item.category,
      date: item.date,
      amount: item.amount,
      icon: item.icon,
      incoming: item.incoming,
      paymentMethod: item.paymentMethod,
      installments: item.installments,
    })

    if (saved) {
      setTransactions(curr => [saved, ...curr.filter(t => t.id !== item.id)])
    }
  }

  const saveCard = async (card: CardItem) => {
    setCards(curr => [...curr, card])
    setNewCardOpen(false)
    setActiveCardIndex(cards.length)
    notify(`Cartão "${card.name}" adicionado!`)

    await createCardApi(card)
  }

  const saveGoal = async (goal: GoalItem) => {
    setGoals(curr => [...curr, goal])
    setNewGoalOpen(false)
    notify(`Meta "${goal.title}" criada!`)

    await createGoalApi(goal)
  }

  const addAmountToGoal = async (goalId: string, amount: number) => {
    const target = goals.find(g => g.id === goalId)
    const newAmount = (target?.currentAmount || 0) + amount

    setGoals(curr =>
      curr.map(g => (g.id === goalId ? { ...g, currentAmount: newAmount } : g))
    )

    await updateGoalAmount(goalId, newAmount)
  }

  const handlePayInvoice = async () => {
    const currentCard = cards[activeCardIndex] || cards[0]
    if (!currentCard) return
    setCards(curr =>
      curr.map((c, i) => (i === activeCardIndex ? { ...c, bill: 0 } : c))
    )
    notify(`Fatura de ${money(currentCard.bill)} paga com sucesso! Limite liberado.`)

    await updateCardBill(currentCard.id, 0)
  }

  // Se não autenticado, exibe a tela de login/cadastro
  if (!isAuthenticated) {
    return (
      <div className="app-shell auth-shell">
        <AuthScreen mode={authMode} setMode={setAuthMode} onLoginSuccess={handleLoginSuccess} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Navigation view={view} setView={setView} />
      <div className="content-shell">
        {view === 'home' && (
          <Home
            hidden={hidden}
            setHidden={setHidden}
            spent={spent}
            transactions={transactions}
            onAdd={() => setAddExpenseOpen(true)}
            onReport={() => setView('report')}
            onAccount={() => setAccountOpen(true)}
            onTransaction={setDetail}
            onGoToCards={() => setView('cards')}
          />
        )}
        {view === 'cards' && (
          <Cards
            cards={cards}
            activeCardIndex={activeCardIndex}
            setActiveCardIndex={setActiveCardIndex}
            onAccount={() => setAccountOpen(true)}
            onGoToInvoice={() => setView('invoice')}
            onNewCard={() => setNewCardOpen(true)}
          />
        )}
        {view === 'invoice' && (
          <InvoicePage
            cards={cards}
            activeCardIndex={activeCardIndex}
            transactions={transactions}
            onAccount={() => setAccountOpen(true)}
            onPayInvoice={handlePayInvoice}
            onBackToCards={() => setView('cards')}
          />
        )}
        {view === 'goals' && (
          <Goals
            goals={goals}
            onAccount={() => setAccountOpen(true)}
            onToast={notify}
            onAddAmount={addAmountToGoal}
            onNewGoal={() => setNewGoalOpen(true)}
          />
        )}
        {view === 'report' && <Report onAccount={() => setAccountOpen(true)} />}
      </div>

      {/* Modais & Gavetas */}
      {addExpenseOpen && <AddExpense onClose={() => setAddExpenseOpen(false)} onSave={saveExpense} />}
      {newCardOpen && <NewCardModal onClose={() => setNewCardOpen(false)} onSave={saveCard} />}
      {newGoalOpen && <NewGoalModal onClose={() => setNewGoalOpen(false)} onSave={saveGoal} />}
      {accountOpen && <AccountSheet user={currentUser} onClose={() => setAccountOpen(false)} onLogout={handleLogout} />}

      {detail && (
        <div className="modal-backdrop" onMouseDown={() => setDetail(null)}>
          <section className="account-sheet detail-sheet" onMouseDown={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h2>Detalhes da Compra</h2>
              <button className="close-text" onClick={() => setDetail(null)}>Fechar</button>
            </div>
            <TransactionRow item={detail} />
            <div className="detail-meta">
              <div className="row-between">
                <span>Forma de pagamento</span>
                <b>{detail.paymentMethod || 'Crédito Principal'}</b>
              </div>
              <div className="row-between">
                <span>Data do lançamento</span>
                <b>{detail.date}</b>
              </div>
              {detail.installments && (
                <div className="row-between">
                  <span>Parcelas</span>
                  <b>{detail.installments}</b>
                </div>
              )}
            </div>
            <button
              className="outline-button"
              onClick={() => notify('Edição de lançamento disponível no próximo passo')}
            >
              Editar Lançamento
            </button>
            <button
              className="logout-button"
              onClick={async () => {
                const idToDelete = detail.id
                setTransactions(items => items.filter(item => item.id !== idToDelete))
                setDetail(null)
                notify('Lançamento removido com sucesso')
                await deleteTransactionApi(idToDelete)
              }}
            >
              Apagar Gasto
            </button>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
