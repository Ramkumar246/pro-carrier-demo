# Pro Carrier Demo - User Guide

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Navigation Bar](#3-navigation-bar)
4. [Performance Analytics (Charts)](#4-performance-analytics-charts)
5. [Live Shipment Tracking Map](#5-live-shipment-tracking-map)
6. [Shipment Data Tables](#6-shipment-data-tables)
7. [Quick Tour Feature](#7-quick-tour-feature)
8. [Keyboard Shortcuts](#8-keyboard-shortcuts)
9. [FAQ](#9-faq)

---

## 1. Getting Started

### Accessing the Application

1. Open your web browser (Chrome, Firefox, Edge, or Safari recommended)
2. Navigate to the application URL
3. You will be automatically redirected to the Shipments dashboard

### First-Time Users

When you first access the application, we recommend taking the **Quick Tour** to familiarize yourself with the interface:

1. Click the **?** (help) icon in the top-right corner
2. Follow the 7-step guided tour
3. Use **Next** / **Back** buttons or arrow keys to navigate
4. Click **Get Started** to complete the tour

---

## 2. Dashboard Overview

The Shipments Dashboard provides a comprehensive view of your logistics operations with four main sections:

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]  │              Navigation Bar                   │
│             ├───────────────────────────────────────────────┤
│  Shipments  │                                               │
│  External   │   ┌─────────────┐    ┌─────────────────────┐ │
│  Page       │   │   Charts    │    │        Map          │ │
│             │   │   (2x2)     │    │                     │ │
│             │   └─────────────┘    └─────────────────────┘ │
│             │                                               │
│             │   ┌─────────────────────────────────────────┐ │
│             │   │            Shipment Tables              │ │
│             │   │   In-Transit | Pending | Completed      │ │
│             │   └─────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────┘
```

### Key Areas

| Area | Purpose |
|------|---------|
| **Sidebar** | Navigate between different pages |
| **Navigation Bar** | Access tools, notifications, and settings |
| **Charts Grid** | View performance metrics and KPIs |
| **Live Map** | Track shipments and vessels in real-time |
| **Data Tables** | Access detailed shipment records |

---

## 3. Navigation Bar

The navigation bar at the top of the dashboard provides quick access to essential tools.

### Components

| Icon | Name | Function |
|------|------|----------|
| **?** | Quick Tour | Launch the guided tour |
| **🔔** | Notifications | View alerts and updates |
| **⊞** | Layout Toggle | Switch between dashboard views |
| **👤** | Profile | Access account settings |

### Notifications Center

The notification bell displays:
- Shipment status changes
- Delivery confirmations
- System alerts
- Important messages

**Red indicator** = Unread notifications available

### Layout Toggle

Click the grid icon to switch between two views:

**Compact View (Default)**
- Charts arranged in 2x2 grid
- Map displayed alongside charts
- Best for: Quick overview, smaller screens

**Expanded View**
- Charts arranged in single row (4 across)
- Map displayed full-width below
- Best for: Detailed analysis, larger screens

### Profile Menu

Access your account settings:
- **Profile Information**: Update your name and details
- **Security Settings**: Change password
- **Notification Preferences**: Configure alert settings
- **Theme Settings**: Customize appearance

---

## 4. Performance Analytics (Charts)

### Available Charts

#### 1. Carbon Emissions
- **Purpose**: Track environmental impact across transport modes
- **Data**: CO2 emissions over time (quarterly)
- **Modes**: Sea (blue), Air (purple), Road (green)

#### 2. Shipment Volumes
- **Purpose**: Monitor shipment quantities
- **Data**: Number of shipments per quarter
- **Trend**: Bar chart with mode breakdown

#### 3. Total Freight Spend
- **Purpose**: Track logistics costs
- **Data**: Spending amounts over time
- **Format**: Currency values with trend lines

#### 4. Shipment Mode Distribution
- **Purpose**: Visualize mode usage
- **Data**: Percentage breakdown by transport mode
- **Format**: Pie/donut chart

### Cross-Filter Feature

The cross-filter feature allows you to analyze data by specific transport modes:

**How to Use:**
1. Click on any mode (Sea, Air, or Road) in any chart
2. All charts instantly filter to show only that mode's data
3. Click the same mode again to clear the filter

**Visual Indicator:**
- Active filter: Mode bar/segment is highlighted
- Inactive modes: Appear dimmed

**Example:**
- Click "Sea" on Carbon Emissions chart
- All four charts now show only Sea transport data
- Click "Sea" again to show all modes

---

## 5. Live Shipment Tracking Map

### Map Features

The interactive map provides real-time visibility into your shipments.

#### Vessel Markers

| Marker Color | Status |
|--------------|--------|
| 🟢 Green | On schedule |
| 🟡 Yellow | Minor delay |
| 🔴 Red | Significant delay |
| 🔵 Blue | In port |

#### Interactions

**Zoom Controls:**
- Mouse wheel: Zoom in/out
- Double-click: Zoom to location
- Pinch (touch): Zoom on mobile

**Pan:**
- Click and drag to move the map

**Vessel Details:**
- Click on any vessel marker to view:
  - Vessel name
  - Current location
  - Destination port
  - Estimated arrival time
  - Cargo details

#### Vessel Clustering

When zoomed out, nearby vessels are grouped into clusters:
- Number in cluster indicates vessel count
- Click cluster to zoom and reveal individual vessels

#### Route Display

Selected vessel routes show:
- Origin port (departure point)
- Destination port (arrival point)
- Route path (line on map)
- Current position (marker)

---

## 6. Shipment Data Tables

### Table Sections

The dashboard includes three collapsible table sections:

#### 1. In-Transit Shipments
Shipments currently being transported
- Status: Active movement
- Priority: High visibility

#### 2. Pending Shipments
Shipments awaiting pickup or processing
- Status: Not yet departed
- Action: Monitor for updates

#### 3. Completed Shipments
Successfully delivered shipments
- Status: Delivered
- Reference: Historical records

### Table Columns

| Column | Description |
|--------|-------------|
| **Shipment ID** | Unique identifier |
| **Origin** | Departure location |
| **Destination** | Arrival location |
| **Mode** | Transport type (Sea/Air/Road) |
| **Status** | Current shipment status |
| **ETA** | Estimated time of arrival |
| **Vessel/Vehicle** | Transport asset name |
| **Container** | Container number (if applicable) |

### Filtering Shipments

Use the filter buttons above the tables:

| Filter | Shows |
|--------|-------|
| **All** | All shipments regardless of mode |
| **Sea** | Ocean freight shipments only |
| **Air** | Air cargo shipments only |
| **Road** | Ground transport shipments only |

### Expanding/Collapsing Tables

- Click the section header to expand or collapse
- Chevron icon indicates state:
  - **▼** = Collapsed (click to expand)
  - **▲** = Expanded (click to collapse)

### Shipment Count Badge

Each section header shows the current count:
- Badge updates based on active filter
- Example: "In-Transit Shipments (12)"

---

## 7. Quick Tour Feature

### Starting the Tour

**Method 1: Help Icon**
- Click the **?** icon in the navigation bar

**Method 2: Keyboard**
- No direct keyboard shortcut (use help icon)

### Tour Steps

The tour covers 7 key areas:

| Step | Area | What You'll Learn |
|------|------|-------------------|
| 1 | Navigation Bar | Overview of top toolbar |
| 2 | Notifications | How to stay informed |
| 3 | Layout Toggle | Switching dashboard views |
| 4 | Profile | Accessing account settings |
| 5 | Charts | Understanding analytics |
| 6 | Map | Using live tracking |
| 7 | Tables | Working with shipment data |

### Tour Navigation

| Action | How To |
|--------|--------|
| **Next Step** | Click "Next" button or press → |
| **Previous Step** | Click "Back" button or press ← |
| **Jump to Step** | Click step dot indicators |
| **Exit Tour** | Click "Skip tour", press Escape, or click backdrop |
| **Complete Tour** | Click "Get Started" on final step |

### Tour Features

- **Visual Illustrations**: Each step shows a preview of the feature
- **Auto-Scroll**: Tour scrolls to elements not in view
- **Progress Bar**: Visual indicator of tour progress
- **Keyboard Support**: Navigate with arrow keys

---

## 8. Keyboard Shortcuts

### Quick Tour

| Key | Action |
|-----|--------|
| `→` | Next step |
| `←` | Previous step |
| `Escape` | Close tour |

### Map Navigation

| Key/Action | Result |
|------------|--------|
| `+` / Scroll Up | Zoom in |
| `-` / Scroll Down | Zoom out |
| Arrow keys | Pan map |

### General

| Key | Action |
|-----|--------|
| `Tab` | Navigate between interactive elements |
| `Enter` | Activate focused button |
| `Space` | Toggle checkboxes/buttons |

---

## 9. FAQ

### General Questions

**Q: How often is the data updated?**
A: The dashboard refreshes data in real-time. Map positions update every 30 seconds.

**Q: Can I export the data?**
A: Export functionality will be available in a future release.

**Q: What browsers are supported?**
A: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Charts

**Q: Why do my charts look empty?**
A: Check if a cross-filter is active. Click the highlighted mode to clear the filter.

**Q: Can I change the time range?**
A: Time range selection will be available in a future update.

### Map

**Q: Why can't I see vessel details?**
A: Click directly on a vessel marker. Cluster badges must be clicked to zoom first.

**Q: The map is slow. What can I do?**
A: Try zooming in to reduce visible vessels, or refresh the page.

### Tables

**Q: How do I search for a specific shipment?**
A: Use the search functionality in the table header (coming soon).

**Q: Can I sort the columns?**
A: Click on column headers to sort ascending/descending.

### Tour

**Q: Can I restart the tour?**
A: Yes, click the **?** icon anytime to start the tour again.

**Q: The tour highlight is not visible. What should I do?**
A: The tour auto-scrolls to off-screen elements. Wait a moment for the animation to complete.

---

## Need Help?

If you encounter issues or have questions:

1. **In-App**: Click the **?** icon for the guided tour
2. **Support**: Contact your system administrator
3. **Documentation**: Refer to the Technical Documentation

---

*Document Version: 1.0*  
*Last Updated: December 2025*  
*Pro Carrier Demo - User Guide*
