# Reflekt - Digital Workbook Platform

A web-based platform that allows organizational consultants to create, distribute, and manage reflective workbooks for their clients.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend/Database**: Convex
- **Authentication**: Convex Auth
- **Styling**: Tailwind CSS
- **Block Editor**: Craft.js
- **Rich Text**: Tiptap
- **PDF Generation**: @react-pdf/renderer
- **Email**: Resend
- **QR Codes**: qrcode.react

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Convex

```bash
npx convex dev
```

This will:
- Create a Convex project
- Generate the `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` variables
- Start the Convex development server

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Resend (for email functionality)
RESEND_API_KEY=your-resend-api-key
```

### 4. Run Development Server

In a separate terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
/reflekt
├── /app                           # Next.js App Router
│   ├── /admin                     # Consultant dashboard
│   ├── /login                     # Login page
│   ├── /signup                    # Signup page
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Landing page
├── /components
│   └── /ui                        # Reusable UI components
├── /convex                        # Convex backend
│   ├── schema.ts                  # Database schema
│   ├── auth.config.ts             # Auth configuration
│   ├── users.ts                   # User functions
│   ├── workbooks.ts               # Workbook CRUD
│   ├── workbookInstances.ts       # Instance management
│   ├── responses.ts               # Auto-save responses
│   └── files.ts                   # File storage
├── /lib                           # Utilities
│   ├── auth.ts                    # Auth hooks
│   └── convex.tsx                 # Convex provider
└── /styles
    └── globals.css                # Global styles + design system
```

## Phase 1 Complete ✓

The following has been implemented:

- ✓ Next.js 14 project with TypeScript and App Router
- ✓ Tailwind CSS with design system colors
- ✓ Convex backend with schema (users, consultantProfiles, workbooks, workbookInstances)
- ✓ Convex Auth with email/password
- ✓ Core Convex functions (users, workbooks, instances, responses)
- ✓ Auth utilities and ConvexProvider
- ✓ Design system UI components (Button, Input, Card, Container, LoadingSpinner)
- ✓ Authentication pages (login, signup)

## Next Steps

### Phase 2: Design System & Shared Components (Remaining)
- Create additional UI components as needed
- Build reusable form components

### Phase 3: Workbook Editor
- Implement Craft.js block editor
- Create block components (Text, Input, Checkbox, Image)
- Build editor interface
- Integrate Tiptap for rich text

### Phase 4: QR Code & Invite System
- QR code generation
- Invite landing flow
- Instance linking

### Phase 5: Client Experience
- Client workbook interface
- Auto-save functionality
- Client home page

### Phase 6: PDF Export
- PDF generation with branding
- Download and email functionality

### Phase 7: Consultant Dashboard
- Dashboard pages
- Client management
- Response viewer

### Phase 8: Polish & Edge Cases
- Loading states
- Error handling
- Mobile optimization
- SEO & meta tags

## Development Commands

```bash
# Start development server
npm run dev

# Start Convex development
npx convex dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Notes

- Convex must be running (`npx convex dev`) for the app to work
- Authentication uses Convex Auth with email/password
- File storage uses Convex File Storage (max 2MB for images)
- Design system colors are defined in `tailwind.config.ts` and `app/globals.css`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Convex Auth](https://labs.convex.dev/auth)
- [Craft.js Documentation](https://craft.js.org)
- [Tiptap Documentation](https://tiptap.dev)
- [Tailwind CSS](https://tailwindcss.com)
