# Zynlo Helpdesk - Modern Ticketsysteem

Een modern ticketsysteem geïnspireerd door Trengo, gebouwd met Next.js, Supabase en TypeScript.

## 🚀 Features

- 📧 Multi-channel support (Email, WhatsApp, Chat)
- 🎫 Intelligent ticket management
- 👥 Team collaboration
- 🤖 AI-powered automations
- 📊 Real-time analytics
- 🔄 Live updates via WebSockets
- 🔒 Enterprise-grade security

## 📋 Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (voor lokale Supabase)
- Supabase CLI

## 🛠️ Installation

1. Clone de repository:
```bash
git clone https://github.com/yourusername/zynlo-helpdesk.git
cd zynlo-helpdesk
```

2. Installeer dependencies:
```bash
pnpm install
```

3. Start Supabase lokaal:
```bash
pnpm supabase:start
```

4. Kopieer environment variables:
```bash
cp .env.schema .env.local
```

5. Update `.env.local` met je Supabase credentials

6. Run database migrations:
```bash
supabase db push
```

7. Genereer TypeScript types:
```bash
pnpm supabase:types
```

8. Start development servers:
```bash
pnpm dev
```

## 🏗️ Project Structuur

```
zynlo-helpdesk/
├── apps/
│   ├── dashboard/          # Next.js frontend applicatie
│   └── api-server/         # Express API server voor webhooks
├── packages/
│   ├── ui/                 # Gedeelde UI componenten
│   ├── supabase/          # Supabase client en hooks
│   └── utils/             # Gedeelde utilities
├── supabase/
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
└── docs/                  # Documentatie
```

## 📝 Development

### Belangrijke Commands

```bash
# Development
pnpm dev                   # Start alle services
pnpm dev:dashboard        # Start alleen dashboard
pnpm dev:api             # Start alleen API server

# Building
pnpm build               # Build alle packages
pnpm start              # Start productie servers

# Testing
pnpm test               # Run tests
pnpm lint              # Lint code
pnpm type-check        # Check TypeScript

# Database
pnpm supabase:start    # Start lokale Supabase
pnpm supabase:stop     # Stop lokale Supabase
pnpm supabase:types    # Genereer types
```

### Code Style

Dit project gebruikt:
- ESLint voor linting
- Prettier voor formatting
- Husky voor pre-commit hooks

## 🔧 Configuration

### Environment Variables

Zie `.env.schema` voor alle benodigde environment variables.

### Database Schema

Het systeem gebruikt de volgende hoofdtabellen:
- `tickets` - Ticket informatie
- `conversations` - Gesprekken per kanaal
- `messages` - Individuele berichten
- `users` - Gebruikers (agents en klanten)
- `teams` - Team structuur

## 🚀 Deployment

### Vercel (Aanbevolen voor Dashboard)

1. Push naar GitHub
2. Importeer in Vercel
3. Configureer environment variables
4. Deploy

### Docker

```bash
docker build -t zynlo-helpdesk .
docker run -p 3000:3000 zynlo-helpdesk
```

## 📚 Documentatie

Voor uitgebreide documentatie, zie de [docs](./docs) folder.

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License.

## 🙏 Acknowledgments

- Geïnspireerd door [Trengo](https://trengo.com)
- Gebouwd met [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com) 