# Pro Carrier Dashboard

## Overview

This project is a front-end shipment analytics dashboard. It allows users to:

- Explore individual shipments in a powerful data grid
- Understand delays at each stage of the journey
- Analyze container mix and transport modes
- Track freight spend and carbon emissions via charts

The app is built as a single-page React application on top of Vite.

## Getting started (local development)

You can run and edit the project locally using any IDE (VS Code, WebStorm, etc.).

**Prerequisites**

- Node.js (LTS recommended)
- npm (bundled with Node) or another package manager such as pnpm or yarn

If needed, you can install Node using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

**Clone and run**

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

By default, Vite will print the local URL in the terminal (commonly http://localhost:5173).

### Recommended npm scripts

- `npm run dev` – start the development server with hot reload
- `npm run build` – create an optimized production build in the `dist` folder
- `npm run preview` – preview the production build locally

## Technology stack

This project is built with:

- **Vite** – fast dev server and build tooling
- **TypeScript** – typed React components and utilities
- **React** – application UI framework
- **shadcn-ui** – composable UI primitives
- **Tailwind CSS** – utility-first styling
- **AG Grid** – data grid for the shipment table

## Project structure (high level)

Some key parts of the codebase:

- `src/pages/Index.tsx` – main dashboard page and top-of-page KPI charts
- `src/components/Layout.tsx` – shared layout wrapper (sidebar, top bar, content area)
- `src/components/ShipmentTable.tsx` – shipment data grid and grid-driven analytics
- `src/components/charts/` – reusable chart components (emissions, volumes, spend, mode mix)
- `src/styles/` – global styles and AG Grid customizations
- `src/data/` – sample shipment data used for the demo

## Deployment

This is a standard Vite + React application and can be deployed to any static hosting platform, for example:

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

Typical deployment flow:

1. Run `npm run build` to generate the production build in the `dist` directory.
2. Configure your hosting provider to use `npm run build` as the build command.
3. Set the publish/output directory to `dist`.
4. Deploy and point your domain at the chosen hosting provider.

## Contributing / customizing

- Adjust dashboard cards and charts in `src/pages/Index.tsx`.
- Modify grid columns, alignment, and analytics in `src/components/ShipmentTable.tsx`.
- Update theme and component styles via Tailwind config and `src/styles/`.

## License

This project is intended for internal/demo use unless a specific license is added to this repository.
