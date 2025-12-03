import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Bell, Grid3x3, User, BarChart3, Map, Table2, Navigation, Compass, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

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

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 400;
const TOOLTIP_HEIGHT = 360;

const getTooltipPosition = (
  anchor: AnchorRect | null,
  placement: "left" | "right" | "top" | "bottom",
): { top: number; left: number; actualPlacement: string } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!anchor) {
    return {
      top: Math.max(80, viewportHeight * 0.25),
      left: Math.max(16, viewportWidth / 2 - TOOLTIP_WIDTH / 2),
      actualPlacement: "center",
    };
  }

  const gap = 24;
  let top = anchor.top;
  let left = anchor.left;
  let actualPlacement = placement;

  if (placement === "right") {
    top = anchor.top + anchor.height / 2 - TOOLTIP_HEIGHT / 2;
    left = anchor.left + anchor.width + gap;
    if (left + TOOLTIP_WIDTH > viewportWidth - 16) {
      left = anchor.left - TOOLTIP_WIDTH - gap;
      actualPlacement = "left";
    }
  } else if (placement === "left") {
    top = anchor.top + anchor.height / 2 - TOOLTIP_HEIGHT / 2;
    left = anchor.left - TOOLTIP_WIDTH - gap;
    if (left < 16) {
      left = anchor.left + anchor.width + gap;
      actualPlacement = "right";
    }
  } else if (placement === "top") {
    top = anchor.top - TOOLTIP_HEIGHT - gap;
    left = anchor.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
    if (top < 16) {
      top = anchor.top + anchor.height + gap;
      actualPlacement = "bottom";
    }
  } else {
    top = anchor.top + anchor.height + gap;
    left = anchor.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
    if (top + TOOLTIP_HEIGHT > viewportHeight - 16) {
      top = anchor.top - TOOLTIP_HEIGHT - gap;
      actualPlacement = "top";
    }
  }

  top = Math.min(Math.max(16, top), viewportHeight - TOOLTIP_HEIGHT - 16);
  left = Math.min(Math.max(16, left), viewportWidth - TOOLTIP_WIDTH - 16);

  return { top, left, actualPlacement };
};

// Illustration components for each tour step
const NavBarIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-10 bg-slate-700/50 flex items-center justify-end px-3 gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
        <Bell className="w-3 h-3 text-primary" />
      </div>
      <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
        <Grid3x3 className="w-3 h-3 text-primary" />
      </div>
      <div className="w-6 h-6 rounded-full bg-primary/50" />
    </div>
    <div className="absolute left-3 top-14 flex items-center gap-2">
      <Navigation className="w-4 h-4 text-primary" />
      <span className="text-[10px] text-white/70">Shipments</span>
    </div>
  </div>
);

const NotificationIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
        <Bell className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
        3
      </div>
    </div>
    <div className="absolute bottom-2 left-3 right-3 space-y-1">
      <div className="h-1.5 bg-white/10 rounded-full w-3/4" />
      <div className="h-1.5 bg-white/10 rounded-full w-1/2" />
    </div>
  </div>
);

const LayoutToggleIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden p-3">
    <div className="flex gap-2 h-full">
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="bg-primary/20 rounded border border-primary/30" />
        <div className="bg-primary/20 rounded border border-primary/30" />
        <div className="bg-primary/20 rounded border border-primary/30" />
        <div className="bg-primary/20 rounded border border-primary/30" />
      </div>
      <div className="w-8 flex items-center justify-center">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <Grid3x3 className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  </div>
);

const ProfileIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
        <User className="w-7 h-7 text-white" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2 bg-white/30 rounded w-20" />
        <div className="h-1.5 bg-white/15 rounded w-16" />
        <div className="flex gap-1 mt-2">
          <div className="h-4 bg-primary/30 rounded px-2 text-[8px] text-primary flex items-center">Profile</div>
          <div className="h-4 bg-white/10 rounded px-2 text-[8px] text-white/50 flex items-center">Settings</div>
        </div>
      </div>
    </div>
  </div>
);

const ChartsIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden p-2">
    <div className="grid grid-cols-2 gap-1.5 h-full">
      <div className="bg-slate-700/50 rounded p-1.5 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <BarChart3 className="w-2.5 h-2.5 text-primary" />
          <span className="text-[7px] text-white/50">Emissions</span>
        </div>
        <div className="flex-1 flex items-end gap-0.5">
          <div className="flex-1 bg-primary/60 rounded-t h-1/3" />
          <div className="flex-1 bg-primary/60 rounded-t h-2/3" />
          <div className="flex-1 bg-primary/60 rounded-t h-1/2" />
          <div className="flex-1 bg-primary rounded-t h-full" />
        </div>
      </div>
      <div className="bg-slate-700/50 rounded p-1.5 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <BarChart3 className="w-2.5 h-2.5 text-accent" />
          <span className="text-[7px] text-white/50">Volumes</span>
        </div>
        <div className="flex-1 flex items-end gap-0.5">
          <div className="flex-1 bg-accent/40 rounded-t h-2/3" />
          <div className="flex-1 bg-accent/60 rounded-t h-1/2" />
          <div className="flex-1 bg-accent rounded-t h-full" />
          <div className="flex-1 bg-accent/70 rounded-t h-3/4" />
        </div>
      </div>
      <div className="bg-slate-700/50 rounded p-1.5 flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <BarChart3 className="w-2.5 h-2.5 text-green-400" />
          <span className="text-[7px] text-white/50">Spend</span>
        </div>
        <div className="flex-1 flex items-end gap-0.5">
          <div className="flex-1 bg-green-400/50 rounded-t h-1/2" />
          <div className="flex-1 bg-green-400/70 rounded-t h-3/4" />
          <div className="flex-1 bg-green-400 rounded-t h-full" />
          <div className="flex-1 bg-green-400/60 rounded-t h-2/3" />
        </div>
      </div>
      <div className="bg-slate-700/50 rounded p-1.5 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  </div>
);

const MapIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-blue-900/80 to-slate-900 rounded-lg overflow-hidden">
    <div className="absolute inset-0 opacity-30">
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <path d="M10,25 Q30,10 50,25 T90,25" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-blue-400" />
        <path d="M5,35 Q25,45 45,30 T85,40" stroke="currentColor" strokeWidth="0.3" fill="none" className="text-blue-300" />
      </svg>
    </div>
    <div className="absolute top-4 left-6 w-3 h-3 bg-red-500 rounded-full animate-ping" />
    <div className="absolute top-4 left-6 w-3 h-3 bg-red-500 rounded-full" />
    <div className="absolute top-8 right-10 w-3 h-3 bg-green-500 rounded-full" />
    <div className="absolute bottom-6 left-1/3 w-3 h-3 bg-primary rounded-full" />
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 rounded px-1.5 py-0.5">
      <Map className="w-2.5 h-2.5 text-white" />
      <span className="text-[8px] text-white/70">Live</span>
    </div>
    <div className="absolute bottom-2 left-2 right-2 h-4 bg-black/20 rounded flex items-center justify-between px-2">
      <span className="text-[7px] text-white/50">12 vessels tracking</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
        <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
      </div>
    </div>
  </div>
);

const TablesIllustration = () => (
  <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden p-2">
    <div className="bg-slate-700/30 rounded h-full overflow-hidden">
      <div className="h-5 bg-slate-600/50 flex items-center px-2 gap-3 border-b border-slate-600/30">
        <Table2 className="w-2.5 h-2.5 text-primary" />
        <div className="h-1.5 bg-white/20 rounded w-12" />
        <div className="h-1.5 bg-white/20 rounded w-8" />
        <div className="h-1.5 bg-white/20 rounded w-10" />
      </div>
      <div className="space-y-0.5 p-1">
        <div className="h-4 flex items-center gap-2 px-1 bg-primary/10 rounded">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          <div className="h-1 bg-white/30 rounded flex-1" />
          <div className="h-1 bg-white/20 rounded w-8" />
        </div>
        <div className="h-4 flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
          <div className="h-1 bg-white/20 rounded flex-1" />
          <div className="h-1 bg-white/15 rounded w-8" />
        </div>
        <div className="h-4 flex items-center gap-2 px-1 bg-slate-600/20 rounded">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
          <div className="h-1 bg-white/20 rounded flex-1" />
          <div className="h-1 bg-white/15 rounded w-8" />
        </div>
      </div>
    </div>
  </div>
);

const QuickTour: React.FC<QuickTourProps> = ({ isOpen, onClose }) => {
  const steps: TourStep[] = useMemo(
    () => [
      {
        id: "topbar",
        title: "Navigation Bar",
        description:
          "Welcome to your Shipments workspace. This navigation bar provides quick access to essential tools and settings—your command center for monitoring logistics performance.",
        targetId: "tour-topbar",
        placement: "bottom",
        illustration: <NavBarIllustration />,
      },
      {
        id: "notifications",
        title: "Notifications Center",
        description:
          "Stay informed with real-time updates. The notification bell displays alerts for shipment status changes, delivery confirmations, and messages from your logistics network.",
        targetId: "tour-notifications",
        placement: "bottom",
        illustration: <NotificationIllustration />,
      },
      {
        id: "layout-toggle",
        title: "Dashboard View Toggle",
        description:
          "Customize your dashboard layout. Switch between compact and expanded chart views to optimize your workflow—detailed analysis or quick overview at a glance.",
        targetId: "tour-layout-toggle",
        placement: "bottom",
        illustration: <LayoutToggleIllustration />,
      },
      {
        id: "profile",
        title: "Profile & Settings",
        description:
          "Access your account preferences. Manage your profile, update security settings, configure notification preferences, and personalize your dashboard experience.",
        targetId: "tour-profile",
        placement: "bottom",
        illustration: <ProfileIllustration />,
      },
      {
        id: "charts",
        title: "Performance Analytics",
        description:
          "Monitor key metrics at a glance. These charts display carbon emissions, shipment volumes, freight spend, and mode distribution—click any chart to cross-filter data.",
        targetId: "tour-charts-grid",
        placement: "right",
        illustration: <ChartsIllustration />,
      },
      {
        id: "map",
        title: "Live Shipment Tracking",
        description:
          "Track vessels in real-time. The interactive map displays shipment locations, routes, and vessel clusters. Click any marker to view detailed journey information.",
        targetId: "tour-map",
        placement: "left",
        illustration: <MapIllustration />,
      },
    ],
    [],
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const highlightedElementRef = React.useRef<HTMLElement | null>(null);

  // Clear zoom effect from previous element
  const clearHighlight = () => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.style.transform = '';
      highlightedElementRef.current.style.zIndex = '';
      highlightedElementRef.current.style.transition = '';
      highlightedElementRef.current.style.transformOrigin = '';
      highlightedElementRef.current.style.position = '';
      highlightedElementRef.current.style.backgroundColor = '';
      highlightedElementRef.current.style.borderRadius = '';
      highlightedElementRef.current = null;
    }
  };

  // Apply zoom effect to current element
  const applyHighlight = (element: HTMLElement) => {
    clearHighlight();
    element.style.zIndex = '10000';
    element.style.position = 'relative';
    element.style.transition = 'transform 0.4s ease-out, background-color 0.3s ease-out';
    element.style.transform = 'scale(1.02)';
    element.style.transformOrigin = 'center center';
    element.style.backgroundColor = 'hsl(var(--card))';
    element.style.borderRadius = '12px';
    highlightedElementRef.current = element;
  };

  const updateAnchorRect = useCallback(() => {
    const step = steps[currentStepIndex];
    if (!step) return;

    const element = document.querySelector<HTMLElement>(
      `[data-tour-id="${step.targetId}"]`,
    );

    if (!element) {
      setAnchorRect(null);
      return;
    }

    // Apply zoom effect
    applyHighlight(element);

    // Scroll element into view if not visible
    const rect = element.getBoundingClientRect();
    const isInView = 
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight;

    if (!isInView) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait for scroll to complete, then update rect
      setTimeout(() => {
        const newRect = element.getBoundingClientRect();
        setAnchorRect({
          top: newRect.top,
          left: newRect.left,
          width: newRect.width,
          height: newRect.height,
        });
      }, 400);
      return;
    }

    setAnchorRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsAnimating(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(false), 400);
      });
    } else {
      setIsVisible(false);
      setIsAnimating(false);
      clearHighlight();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIsAnimating(true);
    updateAnchorRect();
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentStepIndex, isOpen, updateAnchorRect]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateAnchorRect();
    const handleScroll = () => updateAnchorRect();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updateAnchorRect]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
      if (e.key === "ArrowLeft" && currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, currentStepIndex, steps.length]);

  if (!isOpen) return null;

  const step = steps[currentStepIndex];
  if (!step) return null;

  const { top, left } = getTooltipPosition(anchorRect, step.placement ?? "bottom");
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      clearHighlight();
      setIsVisible(false);
      setTimeout(onClose, 300);
      return;
    }
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    clearHighlight();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-all duration-300"
        onClick={handleClose}
      />

      {/* Spotlight highlight */}
      {anchorRect && (
        <>
          {/* Primary highlight border */}
          <div
            className={`pointer-events-none absolute rounded-xl border-[3px] border-primary transition-all duration-500 ease-out ${
              isAnimating ? "opacity-0 scale-105" : "opacity-100 scale-100"
            }`}
            style={{
              top: anchorRect.top - 8,
              left: anchorRect.left - 8,
              width: anchorRect.width + 16,
              height: anchorRect.height + 16,
            }}
          />
          {/* Dashed outer ring */}
          <div
            className={`pointer-events-none absolute rounded-xl border-2 border-dashed border-primary/40 transition-all duration-500 ease-out ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
            style={{
              top: anchorRect.top - 14,
              left: anchorRect.left - 14,
              width: anchorRect.width + 28,
              height: anchorRect.height + 28,
            }}
          />
        </>
      )}

      {/* Tooltip card - z-index higher than highlighted element (10000) */}
      <div
        className={`pointer-events-auto absolute z-[10010] w-[400px] max-w-[calc(100vw-32px)] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden transition-all duration-500 ease-out ${
          isAnimating 
            ? "translate-y-3 opacity-0 scale-95" 
            : "translate-y-0 opacity-100 scale-100"
        }`}
        style={{ top, left }}
      >
        {/* Illustration area */}
        <div className="relative">
          {step.illustration}
          {/* Step badge overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Compass className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-white">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          {/* Close button overlay */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white/80 transition-all hover:bg-black/80 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Title */}
          <h2 className="text-lg font-bold text-foreground">
            {step.title}
          </h2>

          {/* Description */}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Step indicators */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex 
                    ? "w-6 bg-primary" 
                    : idx < currentStepIndex
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip tour
              </button>
              <Link
                to="/documents"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                <BookOpen className="h-3.5 w-3.5" />
                See Documentation
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirst}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                {isLast ? "Get Started" : "Next"}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="border-t border-border/50 px-5 py-2.5 bg-muted/30 rounded-b-2xl">
          <p className="text-[10px] text-muted-foreground text-center">
            Use <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono mx-0.5">←</kbd> 
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono mx-0.5">→</kbd> 
            to navigate or <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono mx-0.5">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickTour;
