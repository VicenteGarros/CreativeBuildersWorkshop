<div align="center">

# eskgo<span>.</span>

**Suas finanças pessoais, num só lugar.**

Controle gastos, cartões, faturas e metas financeiras num painel feito para o dia a dia.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## ✨ Sobre o projeto

O **Eskgo** é um app de finanças pessoais criado no **Creative Builders Workshop**. A ideia é dar uma visão clara de para onde o dinheiro está indo: quanto sobrou do orçamento do mês, qual cartão está mais carregado, quando a fatura vence e quanto falta para realizar cada sonho.

O projeto nasceu no **Figma Make** e foi evoluindo com código: interface em React, dados persistidos no **Supabase** e deploy na **Vercel**.

## 🧩 Funcionalidades

| Tela | O que dá para fazer |
| --- | --- |
| 🔐 **Login e cadastro** | Criar conta, entrar e sair. Inclui um acesso de teste (admin) para explorar o app rapidamente. |
| 🏠 **Início** | Ver o saldo do mês (com botão para **ocultar o valor**), acompanhar o **orçamento mensal** e registrar um **novo gasto** em segundos. |
| 💳 **Cartões** | Carteira de cartões em pilha, com limite total, limite usado, limite disponível, fechamento e vencimento. Dá para **cadastrar novos cartões** e escolher a cor. |
| 🧾 **Fatura** | Fatura detalhada do cartão selecionado, com filtros **Todas / Parceladas / Fixas** e opção de **pagar a fatura**, que libera o limite. |
| 📊 **Relatório** | Resumo por período (semana, mês, ano), evolução diária de gastos e divisão **por categoria**. |
| 🎯 **Metas** | Criar objetivos (viagem, reserva de emergência, curso, carro...), **guardar valores** com atalhos de R$ 100, R$ 250, R$ 500 e R$ 1.000 e ver o progresso de cada meta. |
| 👤 **Conta** | Preferências como ocultar saldo, notificações de vencimento e insights de IA. |

Os gastos, cartões e metas são salvos no Supabase. Se o banco ainda estiver vazio (ou indisponível), o app mostra dados de exemplo para você já conseguir navegar.

## 🛠️ Stack

- **[React 19](https://react.dev/)** para a interface
- **[Vite 8](https://vite.dev/)** para dev server e build
- **[TypeScript](https://www.typescriptlang.org/)** para tipagem
- **[Tailwind CSS 4](https://tailwindcss.com/)** via `@tailwindcss/vite`
- **[Supabase](https://supabase.com/)** (PostgreSQL) para persistência de dados
- **[Prisma](https://www.prisma.io/)** (`prisma/schema.prisma`) como documentação do modelo de dados
- **[oxfmt](https://oxc.rs/)** para formatação de código
- **[Vercel](https://vercel.com/)** para hospedagem

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) **22**
- [pnpm](https://pnpm.io/) **10**
- Um projeto no [Supabase](https://supabase.com/)

> Sem o pnpm instalado? Rode os comandos com `npx pnpm@10 <comando>` ou ative o Corepack com `corepack enable`.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/VicenteGarros/CreativeBuildersWorkshop.git
cd CreativeBuildersWorkshop

# 2. Instale as dependências
pnpm install

# 3. Crie o arquivo de variáveis de ambiente
cp .env.example .env   # ou crie o .env manualmente (veja abaixo)

# 4. Inicie o servidor de desenvolvimento
pnpm dev
```

### 🔑 Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase (em **Project Settings → API**):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

> ⚠️ Como o projeto usa Vite, as variáveis precisam começar com **`VITE_`** para chegarem ao navegador. O arquivo `.env` já está no `.gitignore`: nunca suba suas chaves para o GitHub.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento com hot reload |
| `pnpm build` | Gera o build de produção na pasta `dist/` |
| `pnpm preview` | Serve localmente o build de produção |
| `pnpm format` | Formata o código com o oxfmt |

## 🗄️ Banco de dados

O modelo está descrito em [`prisma/schema.prisma`](prisma/schema.prisma) e usa PostgreSQL no Supabase. São quatro tabelas:

| Tabela | Para que serve |
| --- | --- |
| `profiles` | Perfil e preferências do usuário (orçamento mensal, ocultar saldo, notificações, insights de IA) |
| `transactions` | Gastos e entradas (nome, categoria, valor, data, forma de pagamento, parcelas) |
| `cards` | Cartões (últimos dígitos, limite, fatura atual, dia de fechamento e de vencimento, cor) |
| `goals` | Metas financeiras (valor alvo, valor atual, categoria, data prevista) |

## 📁 Estrutura do projeto

```
.
├── prisma/
│   └── schema.prisma        # Modelo de dados (PostgreSQL / Supabase)
├── public/
│   └── assets/              # Ícones, ilustrações e SVGs de navegação
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Cliente do Supabase
│   │   ├── authService.ts   # Login, cadastro e sessão
│   │   └── financeService.ts# CRUD de transações, cartões e metas
│   ├── App.tsx              # Telas, modais e estado principal
│   ├── index.css            # Estilos globais e Tailwind
│   └── main.tsx             # Ponto de entrada do React
├── index.html
├── vite.config.ts
└── package.json
```
## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas, entre em contato e vamos bater um papo.

## 👤 Autor

Feito por **Vicente Garros**.

[![GitHub](https://img.shields.io/badge/GitHub-VicenteGarros-181717?logo=github)](https://github.com/VicenteGarros)
