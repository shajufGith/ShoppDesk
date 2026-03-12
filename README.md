# ShopDesk

Credit Sales Management application built with Next.js, Prisma, and PostgreSQL.

## Features
- **Multi-tenancy**: Isolated data for different businesses.
- **Customer Area Management**: Group customers by area.
- **Reporting**: Statement, Sales, Collection, and Due reports with Area-wise filtering.
- **PDF Export**: Generate PDF reports using `jspdf`.
- **PWA Support**: Installable on mobile and desktop.

## Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`.
4. Run migrations: `npx prisma db push`
5. Start development server: `npm run dev`
