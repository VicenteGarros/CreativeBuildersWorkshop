import { supabase } from '@/lib/supabase'

export interface AppUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'user'
  avatarUrl?: string
}

const LOCAL_USERS_KEY = 'eskgo_registered_users'
const CURRENT_USER_KEY = 'eskgo_current_user'

// Usuário Administrador de Teste Padrão
export const ADMIN_CREDENTIALS = {
  email: 'seuemail@gmail.com',
  password: '123456',
  fullName: 'Administrador Eskgo',
  role: 'admin' as const,
}

// Inicializar ou carregar usuários locais sincronizados
function getStoredUsers(): Record<string, { passwordHash: string; user: AppUser }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Erro ao ler usuários locais:', err)
  }

  // Usuário Admin inicial padrão
  const initial = {
    [ADMIN_CREDENTIALS.email.toLowerCase()]: {
      passwordHash: hashPassword(ADMIN_CREDENTIALS.password),
      user: {
        id: 'admin-001',
        email: ADMIN_CREDENTIALS.email,
        fullName: ADMIN_CREDENTIALS.fullName,
        role: 'admin' as const,
      },
    },
  }
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initial))
  } catch {}
  return initial
}

function saveStoredUsers(users: Record<string, { passwordHash: string; user: AppUser }>) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Erro ao salvar usuários locais:', err)
  }
}

// Hash simples para verificação de senha
function hashPassword(pass: string): string {
  let hash = 0
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return 'h_' + Math.abs(hash).toString(16)
}

/**
 * Autenticar usuário
 */
export async function loginUser(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: AppUser; message?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanPass = pass.trim()

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Informe seu e-mail e senha.' }
  }

  // 1. Tentar autenticação via Supabase Auth se houver credenciais reais
  try {
    const { data: suData, error: suError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    })

    if (suData?.user && !suError) {
      const user: AppUser = {
        id: suData.user.id,
        email: suData.user.email || cleanEmail,
        fullName: suData.user.user_metadata?.full_name || 'Usuário Eskgo',
        role: cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() ? 'admin' : 'user',
      }
      setCurrentSessionUser(user)
      return { success: true, user }
    }
  } catch (err) {
    // Silently proceed to profiles/local registry
  }

  // 2. Verificar Administrador Padrão
  if (
    cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
    cleanPass === ADMIN_CREDENTIALS.password
  ) {
    const adminUser: AppUser = {
      id: 'admin-001',
      email: ADMIN_CREDENTIALS.email,
      fullName: ADMIN_CREDENTIALS.fullName,
      role: 'admin',
    }

    // Sincronizar perfil no Supabase se possível
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', ADMIN_CREDENTIALS.email)

      if (!existing || existing.length === 0) {
        await supabase.from('profiles').insert([
          {
            email: ADMIN_CREDENTIALS.email,
            full_name: ADMIN_CREDENTIALS.fullName,
            monthly_budget: 5000,
          },
        ])
      }
    } catch (e) {
      console.warn('Sincronização Supabase admin:', e)
    }

    setCurrentSessionUser(adminUser)
    return { success: true, user: adminUser }
  }

  // 3. Verificar usuários registrados na base
  const users = getStoredUsers()
  const record = users[cleanEmail]

  if (!record) {
    return {
      success: false,
      message: 'Usuário não encontrado. Cadastre-se antes de entrar ou verifique seu e-mail.',
    }
  }

  if (record.passwordHash !== hashPassword(cleanPass)) {
    return {
      success: false,
      message: 'Senha incorreta. Verifique suas credenciais e tente novamente.',
    }
  }

  setCurrentSessionUser(record.user)
  return { success: true, user: record.user }
}

/**
 * Cadastrar novo usuário (Salva localmente e no Supabase Profiles)
 */
export async function registerUser(
  fullName: string,
  email: string,
  pass: string
): Promise<{ success: boolean; user?: AppUser; message?: string }> {
  const cleanName = fullName.trim()
  const cleanEmail = email.trim().toLowerCase()
  const cleanPass = pass.trim()

  if (!cleanName) {
    return { success: false, message: 'Informe seu nome completo.' }
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Informe um e-mail válido.' }
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, message: 'A senha deve conter pelo menos 6 caracteres.' }
  }

  const users = getStoredUsers()
  if (users[cleanEmail]) {
    return {
      success: false,
      message: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
    }
  }

  const newUser: AppUser = {
    id: 'user-' + Date.now(),
    email: cleanEmail,
    fullName: cleanName,
    role: cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() ? 'admin' : 'user',
  }

  // Salvar registro de usuário
  users[cleanEmail] = {
    passwordHash: hashPassword(cleanPass),
    user: newUser,
  }
  saveStoredUsers(users)

  // Persistir perfil no Supabase
  try {
    await supabase.from('profiles').insert([
      {
        email: cleanEmail,
        full_name: cleanName,
        monthly_budget: 3200,
      },
    ])
  } catch (err) {
    console.warn('Aviso: Perfil salvo localmente (offline Supabase):', err)
  }

  setCurrentSessionUser(newUser)
  return { success: true, user: newUser }
}

/**
 * Sessão Atual do Usuário
 */
export function getCurrentSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function setCurrentSessionUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  } catch {}
}

export function logoutUser() {
  setCurrentSessionUser(null)
  try {
    supabase.auth.signOut()
  } catch {}
}
