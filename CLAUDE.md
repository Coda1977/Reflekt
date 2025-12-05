# Reflekt - Claude Development Guide

## Project Overview

Reflekt is a digital workbook platform for organizational consultants. Consultants create workbooks with sections, pages, and interactive blocks (text, input fields, checkboxes, images). They share workbooks via QR codes, and clients complete them with auto-saved responses.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database/Backend**: Convex
- **Auth**: Convex Auth (email/password)
- **Editor**: Craft.js (block-based page builder)
- **Rich Text**: Tiptap
- **Styling**: Tailwind CSS
- **PDF**: @react-pdf/renderer
- **Email**: Resend
- **QR Codes**: qrcode.react
- **File Storage**: Convex File Storage

## Key Architecture Decisions

### Single Consultant for v1
- No team management in initial version
- One consultant per deployment
- Designed to add multi-consultant features later

### Template = Workbook
- No distinction between templates and workbooks
- Consultant creates a workbook design
- System generates instances for each client
- Each instance has unique invite token for QR access

### Data Model

```typescript
// Core entities
users (from Convex Auth)
  - email, passwordHash, role: "consultant" | "client"

consultantProfiles
  - userId (link to users)
  - branding: { logoUrl?, primaryColor, secondaryColor, fontFamily }

workbooks (the designs)
  - consultantId
  - title
  - sections: [
      {
        id, title,
        pages: [
          {
            id, title,
            blocks: [
              { type: "text", id, content: string (Tiptap JSON) }
              | { type: "input", id, label, placeholder?, multiline }
              | { type: "checkbox", id, label, options: [{id, text}] }
              | { type: "image", id, url, alt? }
            ]
          }
        ]
      }
    ]

workbookInstances (client copies)
  - workbookId
  - clientId (optional until signup)
  - inviteToken (unique for QR access)
  - responses: { [blockId]: string | string[] }
  - startedAt?, lastUpdatedAt, completedAt?
```

### Authentication Flow

1. **Consultant signup**:
   - Goes to `/signup?redirect=/admin`
   - Creates account with role="consultant"
   - Auto-creates consultantProfile with default branding
   - Redirects to admin dashboard

2. **Client via QR code**:
   - Scans QR → `/workbook/[instanceId]?invite=[token]`
   - If not logged in → redirect to `/signup?redirect=/workbook/[instanceId]&invite=[token]`
   - After signup → link instance to client → redirect to workbook
   - If already logged in → link instance → show workbook

3. **Client direct login**:
   - Goes to `/login` → redirects to `/home`
   - See all their workbook instances across consultants

### File Storage

- Images uploaded to Convex File Storage
- Max 2MB per image
- Store URL in block data
- Use `generateUploadUrl()` mutation for uploads

## Design System

### Colors (in tailwind.config.ts and globals.css)
```css
--bg-primary: #F5F0E8
--text-primary: #1A1A1A
--text-secondary: #4A4A4A
--accent-yellow: #FFD60A
--accent-blue: #003566
--white: #FFFFFF
```

### Typography
- Hero: clamp(48px, 8vw, 80px), font-weight: 900, letter-spacing: -2px
- Section headers: clamp(32px, 5vw, 48px), font-weight: 700
- Body: 18px, line-height: 1.7
- Small: 16px

### Spacing Scale
- XS: 8px
- S: 16px
- M: 32px
- L: 64px
- XL: 128px

### Animations
- Standard transition: 0.3s ease
- Hover lift: translate-y(-8px) + shadow
- No animations > 0.5s

### Component Patterns
```jsx
// Primary Button
<button className="btn-primary">Text</button>

// Feature Card
<div className="feature-card">
  <div className="text-6xl font-black text-accent-yellow">01</div>
  <h3>Title</h3>
  <p>Description</p>
</div>

// Section Container
<section className="section-container">
  <div className="section-inner">{content}</div>
</section>
```

## Project Structure

```
/app
  /admin                    # Consultant dashboard
    /workbooks
      /page.tsx            # List all workbooks
      /new/page.tsx        # Create new workbook
      /[id]
        /edit/page.tsx     # Craft.js editor
        /responses/page.tsx # All instance responses
    /clients
      /page.tsx            # List all clients
      /[id]/page.tsx       # Client detail
    /settings/page.tsx     # Branding settings
  /workbook/[instanceId]/page.tsx  # Client fills workbook
  /home/page.tsx           # Client home (all workbooks)
  /login/page.tsx
  /signup/page.tsx
  /api
    /upload/route.ts       # Image upload proxy
    /pdf/[instanceId]/route.ts  # PDF download
    /email-pdf/route.ts    # Email PDF

/components
  /ui                      # Shared UI components
  /editor
    /blocks                # Craft.js block components
    /TiptapEditor.tsx
  /client                  # Client workbook components

/convex
  schema.ts               # Database schema
  auth.config.ts          # Auth configuration
  users.ts                # User queries/mutations
  workbooks.ts            # Workbook CRUD
  workbookInstances.ts    # Instance management
  responses.ts            # Auto-save responses
  files.ts                # File storage

/lib
  auth.ts                 # Auth hooks
  convex.tsx              # Convex provider
  /pdf
    WorkbookPDF.tsx       # PDF components
    generatePDF.ts        # PDF generation
```

## Convex Patterns

### Authentication Check
```typescript
const userId = await auth.getUserId(ctx);
if (!userId) throw new Error("Not authenticated");
```

### Authorization Check
```typescript
const workbook = await ctx.db.get(workbookId);
if (workbook.consultantId !== userId) {
  throw new Error("Not authorized");
}
```

### Real-time Subscriptions
```typescript
// In React component
const workbooks = useQuery(api.workbooks.getWorkbooks);
// Automatically updates when data changes
```

### File Upload Pattern
```typescript
// 1. Get upload URL (mutation)
const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});

// 2. Upload file
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { storageId } = await result.json();

// 3. Get public URL
const url = await convex.mutation(api.files.getUrl, { storageId });

// 4. Save URL in block data
```

## Craft.js Implementation

### Block Structure
Each block component needs:
1. Render component (what user sees)
2. Settings component (configuration panel)
3. Craft.js registration

```typescript
import { useNode } from '@craftjs/core';

export const TextBlock = ({ content }) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div ref={ref => connect(drag(ref))}>
      <TiptapEditor content={content} />
    </div>
  );
};

TextBlock.craft = {
  displayName: 'Text Block',
  props: { content: '' },
  related: {
    settings: TextBlockSettings
  }
};
```

### Editor Wrapper
```typescript
import { Editor, Frame, Element } from '@craftjs/core';

<Editor resolver={{ TextBlock, InputBlock, CheckboxBlock, ImageBlock }}>
  <Frame>
    <Element is={SectionNode} canvas>
      {/* Sections, pages, blocks */}
    </Element>
  </Frame>
</Editor>
```

### Serialization
```typescript
// Save
const json = query.serialize();
await convex.mutation(api.workbooks.updateWorkbook, {
  workbookId,
  sections: JSON.parse(json)
});

// Load
const workbook = useQuery(api.workbooks.getWorkbook, { workbookId });
const serializedState = JSON.stringify(workbook.sections);
```

## Tiptap Implementation

### Configuration
```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: true,
      orderedList: true,
    }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    // Save as JSON
    const json = editor.getJSON();
    onChange(JSON.stringify(json));
  },
});
```

### Storage Format
- Store as JSON string: `JSON.stringify(editor.getJSON())`
- Load: `editor.commands.setContent(JSON.parse(content))`
- For PDF: Convert JSON to plain text or simple HTML

## Auto-Save Pattern

```typescript
// In client workbook component
import { useMutation } from 'convex/react';
import { useEffect, useState } from 'react';

const [value, setValue] = useState('');
const [saving, setSaving] = useState(false);
const saveResponse = useMutation(api.responses.saveResponse);

useEffect(() => {
  const timer = setTimeout(async () => {
    setSaving(true);
    await saveResponse({
      instanceId,
      blockId,
      value
    });
    setSaving(false);
  }, 1000); // Debounce 1 second

  return () => clearTimeout(timer);
}, [value]);
```

## QR Code Generation

```typescript
import QRCode from 'qrcode.react';

// 1. Create instance
const instanceId = await convex.mutation(api.workbookInstances.createInstance, {
  workbookId
});

// 2. Get instance to retrieve token
const instance = await convex.query(api.workbookInstances.getInstance, {
  instanceId
});

// 3. Build URL
const url = `${window.location.origin}/workbook/${instanceId}?invite=${instance.inviteToken}`;

// 4. Render QR code
<QRCode value={url} size={256} />
```

## PDF Generation

### Structure
```typescript
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const WorkbookPDF = ({ workbook, instance, branding }) => (
  <Document>
    <Page style={styles.page}>
      {/* Header with branding */}
      <View style={styles.header}>
        {branding.logoUrl && <Image src={branding.logoUrl} />}
        <Text style={styles.title}>{workbook.title}</Text>
      </View>

      {/* Sections */}
      {workbook.sections.map(section => (
        <View key={section.id}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.pages.map(page => (
            <View key={page.id}>
              <Text style={styles.pageTitle}>{page.title}</Text>
              {page.blocks.map(block => renderBlock(block, instance.responses))}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);
```

### API Route for Download
```typescript
// app/api/pdf/[instanceId]/route.ts
import { renderToBuffer } from '@react-pdf/renderer';

export async function GET(req, { params }) {
  const { instanceId } = params;

  // Fetch data from Convex
  const data = await convex.query(api.workbookInstances.getInstanceWithWorkbook, {
    instanceId
  });

  // Generate PDF
  const pdfBuffer = await renderToBuffer(<WorkbookPDF {...data} />);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.workbook.title}.pdf"`
    }
  });
}
```

## Development Workflow

### 1. Start Convex Dev Server
```bash
npx convex dev
```
This:
- Pushes schema and functions to Convex
- Watches for changes
- Hot reloads on save
- Provides NEXT_PUBLIC_CONVEX_URL

### 2. Start Next.js Dev Server
```bash
npm run dev
```

### 3. Testing Auth
- Sign up as consultant: `/signup?redirect=/admin`
- Create workbook
- Generate QR code / instance
- Test client flow with QR URL

### 4. Making Schema Changes
1. Edit `convex/schema.ts`
2. Convex dev server auto-detects and pushes changes
3. Data migrations handled automatically for simple changes

## Common Patterns

### Protected Routes
```typescript
// In page component
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) return <LoadingPage />;
  if (user === null) redirect('/login');

  // Check role
  if (user.role !== 'consultant') redirect('/home');

  return <div>Protected content</div>;
}
```

### Form Submission with Convex
```typescript
const createWorkbook = useMutation(api.workbooks.createWorkbook);
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const workbookId = await createWorkbook({
      title,
      sections: []
    });
    router.push(`/admin/workbooks/${workbookId}/edit`);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Optimistic Updates
```typescript
const [localValue, setLocalValue] = useState(serverValue);

const handleChange = (newValue) => {
  setLocalValue(newValue); // Immediate UI update
  saveResponse({ instanceId, blockId, value: newValue }); // Background save
};
```

## Error Handling

### Convex Errors
```typescript
// In Convex function
if (!workbook) {
  throw new Error("Workbook not found");
}

// In React
try {
  await mutation(...);
} catch (error) {
  if (error.message === "Workbook not found") {
    // Handle specific error
  }
}
```

### Network Errors
```typescript
// Convex automatically retries failed mutations
// Show loading state during retry
const mutation = useMutation(api.workbooks.updateWorkbook);
const [isPending, setIsPending] = useState(false);

// useMutation returns a promise
const handleUpdate = async () => {
  setIsPending(true);
  try {
    await mutation({ ... });
  } catch (error) {
    // Only catches if all retries failed
    setError(error);
  } finally {
    setIsPending(false);
  }
};
```

## Performance Considerations

### Query Optimization
- Use indexes for frequently queried fields
- Limit query results with `.take()` if needed
- Use pagination for large lists

### File Size Limits
- Images: 2MB max
- Validate client-side before upload
- Show progress during upload

### Auto-Save Debouncing
- 1 second debounce for text inputs
- Immediate save for checkboxes
- Show "Saving..." indicator

## Security Considerations

### Row-Level Security
Every Convex function checks authorization:
```typescript
// Check ownership
const workbook = await ctx.db.get(workbookId);
if (workbook.consultantId !== userId) {
  throw new Error("Not authorized");
}

// Check client access
const instance = await ctx.db.get(instanceId);
if (instance.clientId !== userId) {
  throw new Error("Not authorized");
}
```

### Input Validation
- Email format validation
- Password strength (min 8 chars)
- File type/size validation for uploads
- Sanitize rich text input (Tiptap handles this)

### Invite Token Security
- Tokens are random strings, not JWTs
- One token per instance
- Checked server-side before linking to client
- No expiration in v1

## Deployment

### Vercel
1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `RESEND_API_KEY`
4. Deploy

### Convex Production
```bash
npx convex deploy --prod
```
This gives you production URLs for env vars.

## Current Status

### ✅ Phase 1 Complete
- Project setup
- Convex schema and functions
- Authentication
- Design system components

### 🚧 In Progress
- Setting up Convex deployment
- Ready to build remaining phases

### 📋 TODO
- Phase 2: Additional components
- Phase 3: Workbook editor (Craft.js + Tiptap)
- Phase 4: QR code system
- Phase 5: Client interface
- Phase 6: PDF export
- Phase 7: Dashboard pages
- Phase 8: Polish

## Tips for Claude

- Always check user role before showing consultant vs client UI
- Use Convex's real-time queries for live updates
- Craft.js state is complex - serialize carefully
- Tiptap JSON must be stringified for storage
- Test QR flow end-to-end (scan → signup → workbook → save)
- Mobile-first for client workbook interface
- Desktop-first for consultant dashboard/editor
- Use TypeScript strictly - Convex generates types
- Run `npx convex dev` before starting dev server
- Check Convex dashboard for function logs/errors

## Resources

- [Convex Docs](https://docs.convex.dev)
- [Convex Auth](https://labs.convex.dev/auth)
- [Craft.js Docs](https://craft.js.org)
- [Tiptap Docs](https://tiptap.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
