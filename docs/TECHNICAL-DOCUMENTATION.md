# Pro Carrier Demo - Technical Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Component Documentation](#4-component-documentation)
5. [State Management](#5-state-management)
6. [Routing](#6-routing)
7. [Styling System](#7-styling-system)
8. [Feature Implementation Details](#8-feature-implementation-details)
9. [API Integration](#9-api-integration)
10. [Build & Deployment](#10-build--deployment)
11. [Testing](#11-testing)
12. [Performance Considerations](#12-performance-considerations)

---

## 1. Project Overview

### Application Summary

**Pro Carrier Demo** is a logistics dashboard application built with React and TypeScript. It provides real-time visibility into shipment operations, including performance analytics, live vessel tracking, and detailed shipment management.

### Key Features

| Feature | Description |
|---------|-------------|
| **Dashboard Layout** | Responsive grid with charts, map, and tables |
| **Performance Charts** | 4 KPI charts with cross-filtering |
| **Live Map** | Mapbox-based vessel tracking |
| **Data Tables** | Collapsible shipment tables by status |
| **Quick Tour** | 7-step onboarding experience |
| **Layout Toggle** | Compact and expanded view modes |

### System Requirements

- Node.js 18.x or higher
- npm 9.x or higher
- Modern browser with ES2020 support

---

## 2. Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool & dev server |
| **React Router** | 6.x | Client-side routing |

### UI & Styling

| Library | Purpose |
|---------|---------|
| **Tailwind CSS** | Utility-first CSS |
| **shadcn/ui** | Component library |
| **Lucide React** | Icon library |
| **class-variance-authority** | Component variants |
| **tailwind-merge** | Class merging utility |

### Data Visualization

| Library | Purpose |
|---------|---------|
| **Recharts** | Chart components |
| **Mapbox GL** | Interactive maps |

### Utilities

| Library | Purpose |
|---------|---------|
| **date-fns** | Date formatting |
| **clsx** | Conditional classes |

---

## 3. Project Structure

```
pro-carrier-demo/
├── docs/                          # Documentation
│   ├── UML-DIAGRAMS.md
│   ├── USER-GUIDE.md
│   └── TECHNICAL-DOCUMENTATION.md
├── public/                        # Static assets
├── src/
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   └── ...
│   │   ├── charts/                # Chart components
│   │   │   ├── CarbonEmissionsChart.tsx
│   │   │   ├── ShipmentVolumesChart.tsx
│   │   │   ├── FreightWeightChart.tsx
│   │   │   └── ShipmentDistributionChart.tsx
│   │   ├── DashboardCard.tsx      # Card wrapper
│   │   ├── FilterButtons.tsx      # Mode filter UI
│   │   ├── Layout.tsx             # Main layout wrapper
│   │   ├── QuickTour.tsx          # Onboarding tour
│   │   ├── ShipmentMap.tsx        # Mapbox map
│   │   ├── ShipmentTable.tsx      # Data table
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   └── TopBar.tsx             # Top navigation bar
│   ├── data/                      # Mock data
│   │   └── shipments.ts
│   ├── hooks/                     # Custom hooks
│   ├── lib/                       # Utilities
│   │   └── utils.ts
│   ├── pages/                     # Page components
│   │   ├── Index.tsx              # Shipments dashboard
│   │   ├── ExternalPage.tsx
│   │   └── NotFound.tsx
│   ├── styles/                    # Additional styles
│   │   └── ag-grid-custom.css
│   ├── App.tsx                    # Root component
│   ├── index.css                  # Global styles & tokens
│   └── main.tsx                   # Entry point
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Component Documentation

### Layout Components

#### `Layout.tsx`

Main layout wrapper that provides consistent structure across pages.

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

// State managed:
// - isLayoutExpanded: boolean (compact/expanded view toggle)
// - isTourOpen: boolean (tour visibility)
```

**Responsibilities:**
- Renders Sidebar, TopBar, and main content area
- Manages tour open/close state
- Passes layout state to child components via cloneElement

**Usage:**
```tsx
<Layout>
  <Index />
</Layout>
```

---

#### `TopBar.tsx`

Top navigation bar with actions and profile.

```typescript
interface TopBarProps {
  isExpanded: boolean;
  onToggleLayout: () => void;
  onOpenTour?: () => void;
}
```

**Elements:**
| Element | data-tour-id | Purpose |
|---------|--------------|---------|
| Container | `tour-topbar` | Full navigation bar |
| Help Icon | - | Triggers tour |
| Bell Icon | `tour-notifications` | Notifications |
| Grid Icon | `tour-layout-toggle` | Layout toggle |
| Avatar | `tour-profile` | Profile access |

---

#### `Sidebar.tsx`

Vertical navigation sidebar with route links.

```typescript
// No props - uses React Router for navigation
```

**Routes:**
- `/shipments` - Main dashboard
- `/external-page` - External page example

---

### Feature Components

#### `QuickTour.tsx`

Step-by-step onboarding tour component.

```typescript
interface QuickTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  placement?: "left" | "right" | "top" | "bottom";
  illustration: React.ReactNode;
}
```

**Internal State:**
| State | Type | Purpose |
|-------|------|---------|
| `currentStepIndex` | number | Active step (0-6) |
| `anchorRect` | AnchorRect \| null | Target element position |
| `isAnimating` | boolean | Transition state |
| `isVisible` | boolean | Fade visibility |

**Tour Steps Configuration:**
```typescript
const steps: TourStep[] = [
  { id: "topbar", targetId: "tour-topbar", ... },
  { id: "notifications", targetId: "tour-notifications", ... },
  { id: "layout-toggle", targetId: "tour-layout-toggle", ... },
  { id: "profile", targetId: "tour-profile", ... },
  { id: "charts", targetId: "tour-charts-grid", ... },
  { id: "map", targetId: "tour-map", ... },
  { id: "tables", targetId: "tour-tables", ... },
];
```

**Key Functions:**

```typescript
// Updates anchor rectangle based on target element
const updateAnchorRect = useCallback(() => {
  const element = document.querySelector(`[data-tour-id="${step.targetId}"]`);
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  
  // Auto-scroll if element not in view
  if (!isInView) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => updateRect(), 400);
  }
}, [currentStepIndex, steps]);

// Calculate tooltip position based on anchor and placement
const getTooltipPosition = (
  anchor: AnchorRect | null,
  placement: "left" | "right" | "top" | "bottom"
) => { ... };
```

**Keyboard Support:**
- `ArrowRight` - Next step
- `ArrowLeft` - Previous step
- `Escape` - Close tour

---

#### `ShipmentMap.tsx`

Interactive Mapbox map for vessel tracking.

```typescript
// No props - self-contained component
```

**Features:**
- Mapbox GL integration
- Vessel markers with status colors
- Route line rendering
- Vessel clustering
- Click interactions for details

**Map Configuration:**
```typescript
const mapConfig = {
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [longitude, latitude],
  zoom: 2,
};
```

---

### Chart Components

All chart components share a common interface:

```typescript
interface ChartProps {
  crossFilterMode: CrossFilterMode;
  onCrossFilterChange: (mode: CrossFilterMode) => void;
  showFullRange?: boolean; // For expanded view
}

type CrossFilterMode = "Sea" | "Air" | "Road" | null;
```

#### `CarbonEmissionsChart.tsx`
- Type: Bar chart
- Data: CO2 emissions by mode over quarters
- Interaction: Click bar to cross-filter

#### `ShipmentVolumesChart.tsx`
- Type: Bar chart
- Data: Shipment counts by mode
- Props: `showFullRange` for extended data

#### `FreightWeightChart.tsx`
- Type: Area/Line chart
- Data: Freight spend over time
- Props: `showFullRange` for extended data

#### `ShipmentDistributionChart.tsx`
- Type: Pie/Donut chart
- Data: Mode percentage breakdown
- Interaction: Click segment to cross-filter

---

### Page Components

#### `Index.tsx` (Shipments Dashboard)

Main dashboard page with all shipment features.

```typescript
interface IndexProps {
  isLayoutExpanded?: boolean;
}
```

**State:**
| State | Type | Purpose |
|-------|------|---------|
| `inTransitOpen` | boolean | In-transit table collapsed |
| `pendingOpen` | boolean | Pending table collapsed |
| `completedOpen` | boolean | Completed table collapsed |
| `activeFilter` | TransportFilter | Table mode filter |
| `crossFilterMode` | CrossFilterMode | Chart cross-filter |

**Data-tour-id Attributes:**
| Element | ID | Target |
|---------|-----|--------|
| Header | `tour-header` | Page header |
| Charts Grid | `tour-charts-grid` | 2x2 chart container |
| Map Container | `tour-map` | Map wrapper |
| Tables Section | `tour-tables` | All shipment tables |

---

## 5. State Management

### Local Component State

The application uses React's built-in `useState` for all state management:

```typescript
// Layout.tsx - Global layout state
const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);
const [isTourOpen, setIsTourOpen] = useState(false);

// Index.tsx - Dashboard state
const [crossFilterMode, setCrossFilterMode] = useState<CrossFilterMode>(null);
const [activeFilter, setActiveFilter] = useState<TransportFilter>("Sea");
const [inTransitOpen, setInTransitOpen] = useState(true);

// QuickTour.tsx - Tour state
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
```

### State Flow

```
Layout (isLayoutExpanded, isTourOpen)
    │
    ├── TopBar
    │   └── receives: isExpanded, onToggleLayout, onOpenTour
    │
    ├── QuickTour
    │   └── receives: isOpen, onClose
    │
    └── Index (via cloneElement)
        └── receives: isLayoutExpanded
        └── manages: crossFilterMode, activeFilter, table states
            │
            └── Charts
                └── receive: crossFilterMode, onCrossFilterChange
```

### Cross-Filter Logic

```typescript
// Toggle cross-filter: click same mode again to clear
const handleCrossFilterChange = useCallback((mode: CrossFilterMode) => {
  setCrossFilterMode((prev) => (prev === mode ? null : mode));
}, []);
```

---

## 6. Routing

### Route Configuration

```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Redirect root to shipments */}
    <Route path="/" element={<Navigate to="/shipments" replace />} />
    
    {/* Main dashboard */}
    <Route path="/shipments" element={
      <Layout>
        <Index />
      </Layout>
    } />
    
    {/* External page */}
    <Route path="/external-page" element={<ExternalPage />} />
    
    {/* 404 catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

### Route Table

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/` | Redirect | - | Redirects to /shipments |
| `/shipments` | Index | Layout | Main dashboard |
| `/external-page` | ExternalPage | None | External page |
| `*` | NotFound | None | 404 page |

---

## 7. Styling System

### Design Tokens

Located in `src/index.css`:

```css
:root {
  /* Colors - HSL format */
  --background: 240 15% 96%;
  --foreground: 240 10% 20%;
  
  --primary: 247 82% 30%;        /* Brand blue */
  --primary-foreground: 0 0% 100%;
  
  --accent: 247 82% 45%;         /* Lighter brand blue */
  --accent-foreground: 0 0% 100%;
  
  --muted: 247 15% 95%;
  --muted-foreground: 247 5% 50%;
  
  --destructive: 0 70% 55%;      /* Red for errors */
  
  --border: 247 10% 88%;
  --ring: 247 82% 30%;
  
  /* Sidebar specific */
  --sidebar-background: 247 50% 16%;
  --sidebar-foreground: 0 0% 95%;
  --sidebar-primary: 247 82% 45%;
  
  /* Chart colors */
  --chart-1: 247 82% 30%;
  --chart-2: 247 82% 45%;
  --chart-3: 199 80% 45%;
  --chart-4: 247 60% 60%;
  --chart-5: 38 80% 55%;
  
  /* Semantic colors */
  --success: 142 60% 50%;
  --warning: 38 80% 55%;
  --info: 199 80% 45%;
  
  --radius: 0.5rem;
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
```

### Component Styling Patterns

**Card with tour highlight:**
```tsx
<div 
  className="rounded-2xl border border-border bg-card shadow-sm"
  data-tour-id="tour-charts-grid"
>
  {/* content */}
</div>
```

**Interactive button:**
```tsx
<button className="w-10 h-10 rounded-lg flex items-center justify-center 
  hover:bg-muted transition-all text-muted-foreground hover:text-foreground">
  <Icon className="w-5 h-5" />
</button>
```

---

## 8. Feature Implementation Details

### Quick Tour Implementation

#### Element Targeting

The tour uses `data-tour-id` attributes to locate target elements:

```tsx
// In components
<div data-tour-id="tour-charts-grid">...</div>

// In QuickTour
const element = document.querySelector(`[data-tour-id="${step.targetId}"]`);
const rect = element.getBoundingClientRect();
```

#### Highlight Positioning

```typescript
// Calculate position relative to viewport
setAnchorRect({
  top: rect.top,
  left: rect.left,
  width: rect.width,
  height: rect.height,
});
```

#### Auto-Scroll Logic

```typescript
const isInView = 
  rect.top >= 0 &&
  rect.bottom <= window.innerHeight;

if (!isInView) {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    // Update rect after scroll completes
    const newRect = element.getBoundingClientRect();
    setAnchorRect({ ... });
  }, 400);
}
```

#### Tooltip Positioning

```typescript
const getTooltipPosition = (anchor, placement) => {
  const gap = 24;
  let { top, left } = anchor;
  
  switch (placement) {
    case "bottom":
      top = anchor.top + anchor.height + gap;
      left = anchor.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "right":
      top = anchor.top + anchor.height / 2 - TOOLTIP_HEIGHT / 2;
      left = anchor.left + anchor.width + gap;
      break;
    // ... other placements
  }
  
  // Clamp to viewport
  top = Math.min(Math.max(16, top), viewportHeight - TOOLTIP_HEIGHT - 16);
  left = Math.min(Math.max(16, left), viewportWidth - TOOLTIP_WIDTH - 16);
  
  return { top, left };
};
```

---

### Cross-Filter Implementation

#### State Management

```typescript
// Parent component (Index.tsx)
const [crossFilterMode, setCrossFilterMode] = useState<CrossFilterMode>(null);

const handleCrossFilterChange = useCallback((mode: CrossFilterMode) => {
  setCrossFilterMode((prev) => (prev === mode ? null : mode));
}, []);
```

#### Chart Integration

```typescript
// In chart component
const CarbonEmissionsChart = ({ crossFilterMode, onCrossFilterChange }) => {
  // Filter data based on mode
  const filteredData = useMemo(() => {
    if (!crossFilterMode) return allData;
    return allData.filter(d => d.mode === crossFilterMode);
  }, [crossFilterMode]);
  
  // Handle click
  const handleBarClick = (mode: string) => {
    onCrossFilterChange(mode as CrossFilterMode);
  };
  
  return (
    <BarChart data={filteredData}>
      <Bar 
        onClick={(data) => handleBarClick(data.mode)}
        opacity={crossFilterMode && crossFilterMode !== mode ? 0.3 : 1}
      />
    </BarChart>
  );
};
```

---

### Layout Toggle Implementation

#### State Flow

```typescript
// Layout.tsx
const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);

// Pass to Index via cloneElement
const enhancedChildren = isValidElement(children)
  ? cloneElement(children, { isLayoutExpanded })
  : children;
```

#### Conditional Rendering

```tsx
// Index.tsx
{!isLayoutExpanded ? (
  // Compact: 2x2 grid + map side-by-side
  <div className="grid grid-cols-1 xl:grid-cols-2">
    <div className="grid grid-cols-2">{/* 4 charts */}</div>
    <div>{/* Map */}</div>
  </div>
) : (
  // Expanded: 4 charts in row + full-width map
  <div className="space-y-4">
    <div className="grid grid-cols-4">{/* 4 charts */}</div>
    <div>{/* Full-width map */}</div>
  </div>
)}
```

---

## 9. API Integration

### Current State (Mock Data)

The application currently uses static mock data:

```typescript
// src/data/shipments.ts
export const shipmentData = {
  inTransit: [...],
  pending: [...],
  completed: [...],
};

export const filterShipmentsByMode = (
  shipments: Shipment[],
  mode: TransportFilter
) => {
  if (mode === "All") return shipments;
  return shipments.filter(s => s.mode === mode);
};
```

### Future API Integration

Recommended structure for REST API integration:

```typescript
// src/api/shipments.ts
const API_BASE = import.meta.env.VITE_API_URL;

export const shipmentApi = {
  getInTransit: () => 
    fetch(`${API_BASE}/shipments/in-transit`).then(r => r.json()),
  
  getPending: () => 
    fetch(`${API_BASE}/shipments/pending`).then(r => r.json()),
  
  getCompleted: () => 
    fetch(`${API_BASE}/shipments/completed`).then(r => r.json()),
  
  getVesselPositions: () => 
    fetch(`${API_BASE}/vessels/positions`).then(r => r.json()),
};
```

**With React Query:**
```typescript
import { useQuery } from '@tanstack/react-query';

const useShipments = (status: string) => {
  return useQuery({
    queryKey: ['shipments', status],
    queryFn: () => shipmentApi.getByStatus(status),
    refetchInterval: 30000, // Real-time updates
  });
};
```

---

## 10. Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start dev server (port 8080)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

### Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── index-[hash].css     # Styles
│   └── vendor-[hash].js     # Dependencies
├── index.html
└── ...
```

### Environment Variables

```bash
# .env
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_API_URL=https://api.example.com
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

---

## 11. Testing

### Recommended Test Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Component Tests

```typescript
// QuickTour.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QuickTour from './QuickTour';

describe('QuickTour', () => {
  it('renders when open', () => {
    render(<QuickTour isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Navigation Bar')).toBeInTheDocument();
  });

  it('advances to next step on Next click', () => {
    render(<QuickTour isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Notifications Center')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<QuickTour isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/tour.spec.ts
test('quick tour completes all steps', async ({ page }) => {
  await page.goto('/shipments');
  await page.click('[title="Take a quick tour"]');
  
  // Step through all 7 steps
  for (let i = 0; i < 6; i++) {
    await expect(page.locator('.tour-tooltip')).toBeVisible();
    await page.click('text=Next');
  }
  
  await page.click('text=Get Started');
  await expect(page.locator('.tour-tooltip')).not.toBeVisible();
});
```

---

## 12. Performance Considerations

### Bundle Optimization

- **Code Splitting**: Routes are lazily loaded
- **Tree Shaking**: Unused code eliminated
- **Minification**: Vite handles CSS/JS minification

### Runtime Performance

| Area | Optimization |
|------|-------------|
| **Charts** | useMemo for filtered data |
| **Tour** | useCallback for handlers |
| **Map** | Marker clustering |
| **Tables** | Virtualization (if needed) |

### Memory Management

```typescript
// QuickTour - cleanup event listeners
useEffect(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);
  
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

### Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 95 |
| SEO | > 90 |

---

*Document Version: 1.0*  
*Last Updated: December 2025*  
*Pro Carrier Demo - Technical Documentation*
