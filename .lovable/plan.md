

# Change Purple Gradient Theme to Orange Gradient Theme

## Overview
This plan transforms the entire purple/violet color scheme throughout the application to a warm orange gradient theme. The change affects CSS variables, component styles, and Tailwind configuration.

---

## Color Mapping Strategy

The purple-to-blue gradient will become an orange-to-amber/yellow gradient:

| Current (Purple) | New (Orange) |
|------------------|--------------|
| `purple-600` (#9333ea) | `orange-500` (#f97316) |
| `purple-700` (#7c3aed) | `orange-600` (#ea580c) |
| `purple-100/200` | `orange-100/200` |
| `purple-50` | `orange-50` |
| `blue-500` | `amber-500` (#f59e0b) |
| `blue-600` | `amber-600` (#d97706) |
| `violet-50` | `amber-50` |
| `indigo-50/100` | `orange-50/100` |
| HSL 270 (purple hue) | HSL 25 (orange hue) |

---

## Files to Modify

### 1. Core Theme File: `src/index.css`

**CSS Variables to update (lines 18-46):**

```css
/* Before */
--primary: 270 70% 50%;
--primary-glow: 250 70% 60%;
--ring: 270 70% 50%;

--gradient-primary: linear-gradient(135deg, hsl(270 70% 50%), hsl(200 80% 50%));
--gradient-hero: linear-gradient(135deg, hsl(270 70% 50%) 0%, hsl(230 75% 55%) 50%, hsl(200 80% 50%) 100%);

--shadow-glow: 0 0 40px hsl(270 70% 50% / 0.3);
--shadow-button: 0 8px 32px hsl(270 70% 50% / 0.4);

/* After */
--primary: 25 95% 53%;
--primary-glow: 35 95% 55%;
--ring: 25 95% 53%;

--gradient-primary: linear-gradient(135deg, hsl(25 95% 53%), hsl(45 95% 55%));
--gradient-hero: linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(35 95% 54%) 50%, hsl(45 95% 55%) 100%);

--shadow-glow: 0 0 40px hsl(25 95% 53% / 0.3);
--shadow-button: 0 8px 32px hsl(25 95% 53% / 0.4);
```

**Animation keyframes to update (lines 167-174):**

```css
/* Before */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(270 70% 50% / 0.3); }
  50% { box-shadow: 0 0 40px hsl(270 70% 50% / 0.6), 0 0 60px hsl(270 70% 50% / 0.4); }
}

/* After */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(25 95% 53% / 0.3); }
  50% { box-shadow: 0 0 40px hsl(25 95% 53% / 0.6), 0 0 60px hsl(25 95% 53% / 0.4); }
}
```

---

### 2. Tailwind Config: `tailwind.config.ts`

**Update the pulse-glow animation (line 102-105):**

```typescript
/* Before */
'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 20px hsl(270 70% 50% / 0.3)' },
  '50%': { boxShadow: '0 0 40px hsl(270 70% 50% / 0.6)' }
}

/* After */
'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 20px hsl(25 95% 53% / 0.3)' },
  '50%': { boxShadow: '0 0 40px hsl(25 95% 53% / 0.6)' }
}
```

---

### 3. Component Files

#### `src/components/Hero.tsx` (line 52)
```tsx
/* Before */
<span className="block bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">

/* After */
<span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
```

#### `src/components/Services.tsx`
- Line 97: `from-purple-50/30 via-blue-50/20` → `from-orange-50/30 via-amber-50/20`
- Line 99: `from-purple-100/20 ... to-blue-100/20` → `from-orange-100/20 ... to-amber-100/20`
- Line 103: `from-purple-600 to-blue-500` → `from-orange-500 to-amber-500`
- Line 114: `hover:border-purple-500/40` → `hover:border-orange-500/40`
- Line 115: `ring-purple-500/50 ... to-purple-900/30` → `ring-orange-500/50 ... to-orange-900/30`

#### `src/components/Features.tsx`
- Line 37: `from-blue-50/30 via-purple-50/20` → `from-amber-50/30 via-orange-50/20`
- Line 39: `from-purple-100/40 via-blue-50/30 to-purple-200/50` → `from-orange-100/40 via-amber-50/30 to-orange-200/50`
- Line 40: `from-blue-100/20 ... to-purple-100/30` → `from-amber-100/20 ... to-orange-100/30`
- Line 42: `border-purple-200/50` → `border-orange-200/50`
- Line 56: `from-purple-600/95 via-purple-700/90 to-blue-600/95 border-purple-400/50` → `from-orange-500/95 via-orange-600/90 to-amber-500/95 border-orange-400/50`

#### `src/components/Pricing.tsx`
- Line 30: `from-indigo-50/30 via-violet-50/20` → `from-orange-50/30 via-amber-50/20`
- Line 32: `from-indigo-100/20 ... to-violet-100/20` → `from-orange-100/20 ... to-amber-100/20`

#### `src/components/CTA.tsx`
- Line 5: `from-purple-50/30 via-blue-50/20` → `from-orange-50/30 via-amber-50/20`
- Line 7: `to-purple-600` → `to-orange-500`

#### `src/components/SalesFunnelHero.tsx` (line 65)
```tsx
/* Before */
className="... bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 ..."

/* After */
className="... bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 ..."
```

#### `src/components/ServiceShowcase.tsx`
- Line 220: `from-purple-600 to-blue-500 ... hover:from-purple-700 hover:to-blue-600` → `from-orange-500 to-amber-500 ... hover:from-orange-600 hover:to-amber-600`
- Line 236: `hover:border-purple-200` → `hover:border-orange-200`
- Line 240: `from-purple-600 to-blue-500` → `from-orange-500 to-amber-500`
- Line 247: `from-purple-100 to-blue-100 ... group-hover:from-purple-200 group-hover:to-blue-200` → `from-orange-100 to-amber-100 ... group-hover:from-orange-200 group-hover:to-amber-200`
- Line 248: `text-purple-600` → `text-orange-500`
- Line 288: Same gradient update as line 220
- Line 299: `from-purple-50 to-blue-50` → `from-orange-50 to-amber-50`
- Line 306: `border-purple-500 text-purple-600 ... hover:from-purple-600 hover:to-blue-500` → `border-orange-500 text-orange-500 ... hover:from-orange-500 hover:to-amber-500`

---

## Summary of Changes

| File | Number of Updates |
|------|-------------------|
| `src/index.css` | 8 color/gradient values |
| `tailwind.config.ts` | 2 keyframe values |
| `src/components/Hero.tsx` | 1 gradient |
| `src/components/Services.tsx` | 5 color classes |
| `src/components/Features.tsx` | 5 color classes |
| `src/components/Pricing.tsx` | 2 gradient backgrounds |
| `src/components/CTA.tsx` | 2 color classes |
| `src/components/SalesFunnelHero.tsx` | 1 button gradient |
| `src/components/ServiceShowcase.tsx` | 7 color classes |

**Total: 9 files, ~33 individual color updates**

---

## Visual Result

After these changes:
- **Primary colors**: Warm orange (#f97316) to amber (#f59e0b)
- **Glows and shadows**: Orange-tinted lighting effects
- **Backgrounds**: Subtle orange/amber gradient overlays
- **Buttons**: Orange-to-amber gradient with matching hover states
- **Cards**: Orange-accented borders and backgrounds

The overall aesthetic will shift from a cool purple/blue tech look to a warm, energetic orange/amber palette while maintaining the same gradient style and visual hierarchy.

