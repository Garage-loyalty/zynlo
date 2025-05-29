# Zynlo Helpdesk 🎫

Een modern ticketsysteem geïnspireerd door Trengo, gebouwd met cutting-edge technologieën voor optimale performance en schaalbaarheid.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- **📬 Multi-channel Support**: Email, WhatsApp, Chat integratie
- **🎯 Intelligent Ticket Routing**: Automatische ticket toewijzing
- **👥 Team Collaboration**: Interne notities en team management
- **🏷️ Label System**: Flexibele categorisatie van tickets
- **📊 Real-time Updates**: Live updates via WebSockets
- **🔍 Advanced Search**: Full-text search met filters
- **📱 Responsive Design**: Werkt perfect op alle apparaten
- **🔒 Enterprise Security**: Row Level Security (RLS) met Supabase

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework met App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Toegankelijke UI componenten
- **React Query** - Data synchronisatie

### Backend
- **Supabase** - PostgreSQL database & Auth
- **Express.js** - API server voor webhooks
- **Edge Functions** - Serverless functies

### Development
- **Turborepo** - Monorepo management
- **pnpm** - Snelle package manager
- **ESLint & Prettier** - Code quality

## 📦 Project Structuur

```
zynlo-helpdesk/
├── apps/
│   ├── dashboard/          # Next.js frontend applicatie
│   └── api-server/         # Express webhook server
├── packages/
│   ├── ui/                 # Gedeelde UI componenten
│   ├── supabase/          # Database types & hooks
│   └── utils/             # Gedeelde utilities
├── supabase/
│   ├── migrations/        # Database migraties
│   └── functions/         # Edge Functions
└── docs/                  # Documentatie
```

## 🛠️ Installatie

### Vereisten
- Node.js 18+
- pnpm 8+
- Supabase account
- (Optioneel) Docker voor lokale Supabase

### Setup

1. **Clone de repository**
   ```bash
   git clone https://github.com/Garage-loyalty/zynlo.git
   cd zynlo
   ```

2. **Installeer dependencies**
   ```bash
   pnpm install
   ```

3. **Configureer environment variables**
   ```bash
   cp apps/dashboard/.env.example apps/dashboard/.env.local
   cp apps/api-server/.env.example apps/api-server/.env.local
   ```

4. **Setup Supabase**
   ```bash
   # Start lokale Supabase (optioneel)
   npx supabase start

   # Of gebruik Supabase cloud en voer migraties uit
   npx supabase db push
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

## 🔧 Configuratie

### Environment Variables

#### Dashboard (`apps/dashboard/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### API Server (`apps/api-server/.env.local`)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📝 Development Workflow

### Commands

```bash
# Development
pnpm dev              # Start alle services
pnpm dev:dashboard    # Start alleen dashboard
pnpm dev:api         # Start alleen API server

# Build
pnpm build           # Build alle packages
pnpm build:dashboard # Build dashboard

# Testing
pnpm test            # Run tests
pnpm lint            # Run linter
pnpm type-check      # TypeScript check

# Database
pnpm db:migrate      # Run migraties
pnpm db:seed         # Seed database
pnpm db:types        # Genereer TypeScript types
```

### Git Workflow

1. Maak een feature branch: `git checkout -b feature/nieuwe-feature`
2. Commit changes: `git commit -m "feat: beschrijving"`
3. Push branch: `git push origin feature/nieuwe-feature`
4. Open een Pull Request

## 🔌 Integraties

### Email Setup
Zie [EMAIL_INTEGRATION.md](docs/EMAIL_INTEGRATION.md) voor gedetailleerde instructies.

### WhatsApp Setup
1. Configureer Twilio account
2. Set webhook URL naar `https://your-domain.com/webhooks/whatsapp/:project_id`
3. Voeg credentials toe aan environment variables

## 🚀 Deployment

### Vercel (Aanbevolen)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy met één klik

### Docker
```bash
docker-compose up -d
```

## 📚 Documentatie

- [Architectuur Overzicht](docs/ARCHITECTURE.md)
- [Database Structuur](docs/DATABASE_STRUCTURE.md)
- [API Documentatie](docs/API.md)
- [Cursor AI Tips](docs/CURSOR_TIPS.md)

## 🤝 Contributing

Bijdragen zijn welkom! Zie onze [Contributing Guidelines](CONTRIBUTING.md).

## 📄 Licentie

Dit project is gelicentieerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🙏 Credits

- Geïnspireerd door [Trengo](https://trengo.com)
- Gebouwd met ❤️ door het Garage Loyalty team

---

**Need help?** Open een [issue](https://github.com/Garage-loyalty/zynlo/issues) of join onze [Discord](https://discord.gg/zynlo). 