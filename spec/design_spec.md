# Zero Downtime Design System

## Core Philosophy
The interface should feel like a modern, professional productivity tool (inspired by Notion, Linear, Vercel).
- **Minimalist & Utilitarian:** High information density, clear typography, no unnecessary flair.
- **Clean Borders & Subtle Shadows:** Rely on borders (`ring-1`, `border`) rather than heavy dropshadows or gradients.
- **Muted Colors for Structure:** Use `muted` and `muted-foreground` for secondary information and backgrounds to establish clear visual hierarchy.

## Design Tokens

### Radius
- **Global Border Radius:** `0.5rem` (`rounded-md` or `rounded-lg` depending on element size).
- Avoid excessive pill shapes (`rounded-full`) or large radii (`rounded-2xl`, `rounded-3xl`) unless explicitly required for avatars or status dots.

### Colors
- **Backgrounds:** Use solid, neutral colors (`bg-background`, `bg-card`). Avoid radial or linear gradients for structural elements.
- **Accents:** Use primary colors sparingly for primary actions (Submit, Start, Create).
- **Status Indicators:** Use subtle, semi-transparent backgrounds with clear text colors (e.g., `bg-green-500/10 text-green-700` for UP/RUNNING).

### Spacing & Layout
- **Containers:** Use `Card` from `shadcn/ui` as the primary structural container. Ensure `shadow-none` and `border` are applied to keep the look flat and clean.
- **Padding:** Consistent padding inside cards (e.g., `p-4` to `p-6`).
- **Headers:** Section headers should use small, uppercase, bold tracking text (`text-[10px] font-bold uppercase tracking-widest text-muted-foreground`) to categorize information clearly.

## Component Guidelines

### Forms
- Forms should be clean, using `shadcn/ui` `Form`, `Input`, `Select`, and `Checkbox`.
- Avoid heavy hover effects on inputs. Rely on `focus-visible:ring-1`.
- Secondary actions (like "Cancel") should use `variant="outline"`.

### Tables & Lists
- Use standard `Table` components for data presentation.
- Eliminate complex custom CSS grids or overlapping "blobs" for data layout.
- Data rows should have a subtle hover effect (`hover:bg-muted/50`).

### Badges
- Status badges should have a clear outline or subtle background.
- Keep badge text small and uppercase for metadata (e.g., `HTTP`, `TCP`, `Region`).

### Typography
- Primary headings should be `font-semibold` and `tracking-tight`.
- Secondary information should be `text-muted-foreground` and slightly smaller.
- Maintain a clean, sans-serif font stack.

## Prohibited Elements (Anti-Patterns)
- ❌ Heavy radial or linear gradients (`bg-gradient-to-r`, `radial-gradient`) used as ambient backgrounds.
- ❌ Oversized drop shadows (`shadow-lg`, `shadow-xl`) on structural cards.
- ❌ Complex, non-standard border shapes or mismatched radii.
- ❌ "Gimmicky" pulse animations unless strictly necessary to indicate an active, time-sensitive state (e.g., a tiny status dot).
