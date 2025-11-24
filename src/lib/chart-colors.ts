/**
 * Utility function to get CSS variable value and convert it to a format amCharts understands
 * amCharts accepts hex colors, so we convert HSL to hex
 */
export const getCSSVariableColor = (variableName: string): string => {
  if (typeof window === 'undefined') {
    // Fallback colors for SSR
    const fallbacks: Record<string, string> = {
      '--chart-1': '#2b2a7a',
      '--chart-2': '#3b82f6',
      '--chart-3': '#06b6d4',
      '--chart-4': '#8b5cf6',
      '--chart-5': '#f59e0b',
      '--card': '#ffffff',
      '--border': '#e5e7eb',
      '--foreground': '#1f2937',
      '--primary': '#2b2a7a',
      '--muted-foreground': '#6b7280',
    };
    return fallbacks[variableName] || '#000000';
  }

  const root = document.documentElement;
  const hslValue = getComputedStyle(root).getPropertyValue(variableName).trim();
  
  if (!hslValue) {
    return '#000000';
  }

  // Convert HSL string (e.g., "247 82% 30%") to hex format that amCharts understands
  const parts = hslValue.split(' ');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace('%', '')) / 100;
    const l = parseFloat(parts[2].replace('%', '')) / 100;
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    // Convert RGB to hex
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  // Fallback if format is unexpected
  return '#000000';
};

