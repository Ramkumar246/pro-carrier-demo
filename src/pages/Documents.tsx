import { Book, Ship, BarChart3, Map, Bell, Grid3x3, User, ArrowLeft, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      id: "getting-started",
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of navigating the Shipments Dashboard",
      content: `
## Welcome to Pro Carrier

Pro Carrier is your comprehensive logistics management platform designed to provide real-time visibility into your shipment operations.

### First Steps

1. **Navigate to Shipments** - Click "Shipments" in the sidebar to access the main dashboard
2. **Take the Quick Tour** - Click the **?** icon in the top bar to learn about key features
3. **Explore the Dashboard** - Review charts, map, and shipment tables

### Dashboard Layout

The dashboard is divided into three main sections:
- **Performance Charts** - KPI metrics at a glance
- **Live Tracking Map** - Real-time vessel positions
- **Shipment Tables** - Detailed shipment records
      `,
    },
    {
      id: "navigation-bar",
      icon: Ship,
      title: "Navigation Bar",
      description: "Understanding the top navigation controls",
      content: `
## Navigation Bar Guide

The navigation bar provides quick access to essential tools and settings.

### Available Controls

| Icon | Function | Description |
|------|----------|-------------|
| **?** | Quick Tour | Launch guided tour of the dashboard |
| **🔔** | Notifications | View alerts, status updates, and messages |
| **⊞** | Layout Toggle | Switch between compact and expanded views |
| **Avatar** | Profile | Access account settings and preferences |

### Notification Center

The notification bell displays:
- Shipment status changes (departed, arrived, delayed)
- Delivery confirmations
- System alerts and maintenance notices
- Important messages from your team

**Red indicator** = You have unread notifications

### Layout Toggle

Click the grid icon to switch between two dashboard layouts:

**Compact View (Default)**
- Charts in 2×2 grid alongside the map
- Best for quick overview and smaller screens

**Expanded View**
- Charts in a single row (4 across)
- Full-width map below
- Best for detailed analysis on larger screens
      `,
    },
    {
      id: "performance-charts",
      icon: BarChart3,
      title: "Performance Analytics",
      description: "How to read and interact with the KPI charts",
      content: `
## Performance Analytics

Monitor your logistics performance through four key metric charts.

### Available Charts

#### 1. Carbon Emissions
Track your environmental impact across transport modes:
- **Sea** (Blue) - Ocean freight emissions
- **Air** (Purple) - Air cargo emissions  
- **Road** (Green) - Ground transport emissions

#### 2. Shipment Volumes
Monitor shipment quantities by quarter and transport mode.

#### 3. Total Freight Spend
Track logistics costs with trend analysis over time.

#### 4. Shipment Mode Distribution
Visualize the percentage breakdown of shipments by transport mode.

### Cross-Filter Feature

**What is Cross-Filtering?**
Cross-filtering allows you to analyze data by specific transport modes across all charts simultaneously.

**How to Use:**
1. Click on any mode segment (Sea, Air, or Road) in any chart
2. All charts instantly filter to show only that mode's data
3. The selected mode is highlighted across all visualizations
4. Click the same mode again to clear the filter and show all data

**Example:**
- Click "Sea" on the Carbon Emissions chart
- All four charts now display only Sea transport data
- Click "Sea" again to return to the full view
      `,
    },
    {
      id: "live-tracking",
      icon: Map,
      title: "Live Shipment Tracking",
      description: "Using the interactive map for vessel tracking",
      content: `
## Live Shipment Tracking Map

The interactive map provides real-time visibility into your shipment locations and vessel movements.

### Map Features

#### Vessel Markers
Vessels are displayed with color-coded markers:
- 🟢 **Green** - On schedule
- 🟡 **Yellow** - Minor delay (< 24 hours)
- 🔴 **Red** - Significant delay (> 24 hours)
- 🔵 **Blue** - Currently in port

#### Interactions

**Zoom Controls:**
- Mouse wheel to zoom in/out
- Double-click to zoom to a location
- Pinch gesture on touch devices

**Pan:**
- Click and drag to move the map

**Vessel Details:**
Click any vessel marker to view:
- Vessel name and type
- Current position (lat/long)
- Origin and destination ports
- Estimated time of arrival (ETA)
- Cargo summary

#### Route Display
When a vessel is selected:
- **Solid line** - Completed journey segment
- **Dashed line** - Remaining route to destination
- **Origin marker** - Departure port
- **Destination marker** - Arrival port

#### Vessel Clustering
When zoomed out, nearby vessels are grouped:
- Number badge shows vessel count
- Click cluster to zoom and reveal individual vessels
      `,
    },
    {
      id: "shipment-tables",
      icon: Ship,
      title: "Shipment Data Tables",
      description: "Managing and filtering shipment records",
      content: `
## Shipment Data Tables

Access detailed shipment information organized by status.

### Table Sections

#### In-Transit Shipments
- Shipments currently being transported
- Real-time status updates
- Priority visibility for active cargo

#### Pending Shipments
- Shipments awaiting pickup or processing
- Scheduled departure information
- Booking confirmations

#### Completed Shipments
- Successfully delivered shipments
- Historical records for reference
- Delivery confirmations

### Table Columns

| Column | Description |
|--------|-------------|
| **Shipment ID** | Unique identifier for tracking |
| **Origin** | Departure location/port |
| **Destination** | Arrival location/port |
| **Mode** | Transport type (Sea/Air/Road) |
| **Status** | Current shipment status |
| **ETA** | Estimated time of arrival |
| **Vessel/Vehicle** | Transport asset name |

### Filtering

Use the filter buttons above the tables:
- **All** - Show all shipments
- **Sea** - Ocean freight only
- **Air** - Air cargo only
- **Road** - Ground transport only

### Expanding/Collapsing

- Click section header to expand or collapse
- Chevron icon indicates current state
- Badge shows shipment count per section
      `,
    },
    {
      id: "keyboard-shortcuts",
      icon: Grid3x3,
      title: "Keyboard Shortcuts",
      description: "Quick navigation using keyboard",
      content: `
## Keyboard Shortcuts

Speed up your workflow with these keyboard shortcuts.

### Quick Tour Navigation

| Key | Action |
|-----|--------|
| \`→\` (Right Arrow) | Next step |
| \`←\` (Left Arrow) | Previous step |
| \`Escape\` | Close tour |

### Map Navigation

| Key/Action | Result |
|------------|--------|
| \`+\` or Scroll Up | Zoom in |
| \`-\` or Scroll Down | Zoom out |
| Arrow keys | Pan map |

### General Navigation

| Key | Action |
|-----|--------|
| \`Tab\` | Move between interactive elements |
| \`Enter\` | Activate focused button |
| \`Space\` | Toggle checkboxes/buttons |
      `,
    },
  ];

  const filteredSections = sections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeSection, setActiveSection] = useState(sections[0].id);

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 right-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Elements */}
        <div className="absolute top-20 left-[15%] w-2 h-2 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-40 right-[20%] w-3 h-3 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[60%] left-[10%] w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[10%] w-4 h-4 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 bg-primary/25 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[45%] right-[35%] w-3 h-3 bg-accent/15 rounded-full animate-float" style={{ animationDelay: '0.8s' }} />

        {/* Diagonal Lines */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonal" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="hsl(var(--primary))" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal)" />
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/shipments"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Documentation</h1>
          </div>
          <div className="w-[180px]" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-24">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-primary-foreground" : ""}`}>
                          {section.title}
                        </p>
                        <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {section.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {currentSection && (
              <article className="bg-card rounded-2xl border border-border p-8">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                  {(() => {
                    const Icon = currentSection.icon;
                    return (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{currentSection.title}</h2>
                    <p className="text-muted-foreground">{currentSection.description}</p>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="space-y-4 text-foreground/90 leading-relaxed">
                    {currentSection.content.split('\n').map((line, index) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-xl font-bold text-foreground mt-8 mb-4">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('#### ')) {
                        return <h4 key={index} className="text-base font-semibold text-foreground mt-4 mb-2">{line.replace('#### ', '')}</h4>;
                      }
                      if (line.startsWith('| ')) {
                        return (
                          <div key={index} className="overflow-x-auto">
                            <pre className="text-sm bg-muted/50 p-2 rounded">{line}</pre>
                          </div>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return <li key={index} className="ml-4 text-muted-foreground">{line.replace('- ', '')}</li>;
                      }
                      if (line.match(/^\d+\. /)) {
                        return <li key={index} className="ml-4 text-muted-foreground list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={index} className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.trim() === '') {
                        return <div key={index} className="h-2" />;
                      }
                      return <p key={index} className="text-muted-foreground">{line}</p>;
                    })}
                  </div>
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Documents;
