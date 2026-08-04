# Finance Tracker Design System

## Overview

Clean, modern financial tracking UI focused on clarity and data readability. Mobile-first responsive design with subtle animations and high contrast for numbers.

---

## Colors

### Primary Palette

- **Primary Teal**: `#0d9488` (Tailwind `teal-600`) — Main UI elements, primary buttons
- **Primary Light**: `#2dd4bf` (Tailwind `teal-400`) — Hover states, accents
- **Primary Dark**: `#115e59` (Tailwind `teal-700`) — Text on light surfaces
- **Primary BG**: `#f0fdfa` (Tailwind `teal-50`) — Page backgrounds

### Semantic Colors

- **Success (Income)**: `#16a34a` (Tailwind `green-600`) — Income, positive balance
- **Success Light**: `#86efac` (Tailwind `green-300`)
- **Danger (Expense)**: `#dc2626` (Tailwind `red-600`) — Expense, negative balance
- **Danger Light**: `#fca5a5` (Tailwind `red-300`)
- **Warning (Overdue)**: `#ea580c` (Tailwind `orange-600`) — Past due dates
- **Warning Light**: `#fdba74` (Tailwind `orange-300`)
- **Info (Transfer)**: `#2563eb` (Tailwind `blue-600`) — Transfer transactions

### Neutral Palette

- **Surface Base**: `#fafafa` (Tailwind `gray-50`) — Page background
- **Surface Card**: `#ffffff` (Tailwind `white`) — Cards, panels
- **Text Primary**: `#1f2937` (Tailwind `gray-800`) — Headings, main text
- **Text Secondary**: `#6b7280` (Tailwind `gray-500`) — Labels, metadata
- **Text Muted**: `#9ca3af` (Tailwind `gray-400`) — Placeholder, disabled
- **Border**: `#e5e7eb` (Tailwind `gray-200`) — Dividers, inputs
- **Input BG**: `#fffbeb` (Tailwind `amber-50`) — Input surfaces

### Status Badges

- **Active**: `#dbeafe` bg + `#1d4ed8` text (Tailwind `blue-100/800`)
- **Lunas**: `#dcfce7` bg + `#16a34a` text (Tailwind `green-100/600`)
- **Overdue**: `#fef3c7` bg + `#d97706` text (Tailwind `amber-200/700`)

---

## Typography

**Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

- **Display XL**: 48px, extra-bold (800) — Dashboard title
- **H1**: 32px, extra-bold (800) — Section headings
- **H2**: 24px, bold (700) — Subsection titles
- **H3**: 20px, semibold (600) — Card titles
- **Body LG**: 18px, regular (400) — Large body text
- **Body**: 16px, regular (400) — Standard body
- **Body SM**: 14px, medium (500) — Labels, button text
- **XS**: 12px, medium (500) — Metadata, timestamps

**Numbers**: Use tabular nums for alignment in tables

```css
.tabular-nums { font-feature-settings: "tnum"; }
```

---

## Spacing

Base unit: **8px**

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

---

## Border Radius

- **sm** (4px): Tags, small badges
- **md** (8px): Inputs, buttons
- **lg** (12px): Cards, panels
- **xl** (16px): Modal dialogs
- **round** (9999px): Pill buttons, status badges

---

## Shadows

- **shadow-sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **shadow-md**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- **shadow-lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **shadow-xl**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

### Colored Shadows

- **shadow-teal-glow**: `0 4px 16px 0 rgb(13 148 136 / 0.15)` — Primary CTAs
- **shadow-green-glow**: `0 4px 16px 0 rgb(22 163 74 / 0.2)` — Income cards
- **shadow-red-glow**: `0 4px 16px 0 rgb(220 38 38 / 0.2)` — Expense cards

---

## Components

### Buttons

#### Primary Button (Teal CTA)
- Background: `#0d9488`
- Text: white
- Padding: `12px 24px`
- Border-radius: `8px` or `9999px` (pill)
- Font: 16px semibold
- Shadow: `shadow-teal-glow`
- Hover: background `#0c8279`, scale `0.98`
- Active: scale `0.95`
- Transition: all `150ms ease-out`

#### Secondary Button (Gray Outline)
- Background: transparent
- Border: `2px solid #e5e7eb`
- Text: `#374151`
- Same padding/size as primary

#### Danger Button (Delete)
- Background: `#dc2626`
- Text: white
- Hover: background `#b91c1c`

#### Icon Button
- Size: 40px x 40px
- Background: `#f3f4f6` hover → `#e5e7eb`
- Icon color: `#6b7280`

### Cards

#### Default Card
- Background: `#ffffff`
- Border-radius: `16px`
- Padding: `20px`
- Shadow: `shadow-md`
- Border: `1px solid #f3f4f6`

#### Income Card Accent
- Left border: `4px solid #16a34a`

#### Expense Card Accent
- Left border: `4px solid #dc2626`

#### Empty State Card
- Background: `#f9fafb`
- Padding: `48px 24px`
- Centered icon + text

### Inputs

#### Text Input
- Background: `#fffbeb` (amber-50)
- Border: `2px solid #e5e7eb`
- Border-radius: `8px`
- Padding: `12px 16px`
- Font: 16px body
- Focus: border `#0d9488`, outline none
- Placeholder: `#9ca3af`

#### Select Dropdown
- Same as text input
- Arrow icon on right: `#6b7280`

#### Date Picker
- Same styling as text input
- Calendar icon on right

### Forms

#### Form Field
- Label: 14px semibold, `#374151`, margin-bottom `8px`
- Input: full width
- Error message: 12px, `#dc2626`, margin-top `4px`
- Helper text: 12px, `#6b7280`, margin-top `4px`

### Badges

#### Status Badge
- Background: varies by status (see Color Palette)
- Text color: complementary dark
- Padding: `4px 12px`
- Border-radius: `9999px`
- Font: 12px semibold

#### Amount Badge (Positive/Negative)
- Positive: bg `#dcfce7`, text `#16a34a`
- Negative: bg `#fee2e2`, text `#dc2626`
- Border-radius: `8px`
- Font: 14px semibold, tabular nums

### Tables

#### Transaction Table
- Header: bg `#f9fafb`, font-semibold
- Row: hover bg `#f9fafb`
- Border-bottom: `1px solid #f3f4f6`
- Cell padding: `12px 16px`

### Lists

#### List Item
- Padding: `16px`
- Hover: bg `#f9fafb`
- Border-radius: `12px`
- Separator: `border-b border-gray-100` (except last item)

### Modals / Dialogs

#### Modal Container
- Overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm`
- Content: center-aligned, max-width `500px`
- Background: `#ffffff`
- Border-radius: `20px`
- Padding: `24px`
- Shadow: `shadow-xl`

### Navigation

#### Bottom Nav (Mobile)
- Height: 64px
- Background: `#ffffff`
- Border-top: `1px solid #e5e7eb`
- Items: flex-center, icon + label (12px)
- Active state: teal text/icon, bottom indicator

#### Top Bar (Mobile)
- Height: 56px
- Background: `#ffffff`
- Shadow: `shadow-sm`
- Title: centered, h3 style

### Dashboard Widgets

#### Balance Card
- Gradient: linear from `#f0fdfa` to `#ffffff`
- Padding: `24px`
- Border-radius: `20px`
- Shadow: `shadow-md`
- Big number: 40px extra-bold, primary
- Label: 14px secondary

#### Summary Card
- Grid: 3 columns on mobile
- Each: small amount + icon
- Icon: 32px rounded bg, colored by type

### Charts

#### Line Chart
- Stroke width: 3px
- Fill opacity: 0.1 below line
- Points: circle fill, hover expand
- Colors: income=`#16a34a`, expense=`#dc2626`

#### Pie/Bar Chart
- Segments: custom colors per category
- Legend below chart
- Tooltips: dark bg, white text, border-radius 8px

---

## Animations

### Micro-interactions

- **Button Press**: scale `0.95`, duration `100ms`
- **Card Hover**: translateY `-2px`, duration `200ms`
- **Focus Ring**: opacity 0→1, scale `1.02`, duration `150ms`

### Page Transitions

- **Fade In**: opacity 0→1, height auto, duration `300ms`
- **Slide Up**: translateY `20px`→0, opacity 0→1, duration `300ms`

### Loading States

- **Skeleton**: shimmer animation (gradient shift left→right, 1.5s)
- **Spinner**: circular, 24px, primary color, 1s rotate

---

## Responsive Breakpoints

- **Mobile**: < 640px (single column)
- **Tablet**: 640–1024px (2 columns)
- **Desktop**: > 1024px (3+ columns, sidebar layout optional)

---

## Do's and Don'ts

1. Do use green/red consistently for income/expense
2. Do emphasize numbers with larger font + bold weight
3. Do use card-based layout for transaction items
4. Do provide empty states with helpful prompts
5. Do use clear visual hierarchy (H1 > H2 > H3 > Body)
6. Do not use more than 3 primary colors on one screen
7. Do not make touch targets smaller than 44x44px
8. Do not use red/green alone for status (add icon/text)
9. Do ensure contrast ratio ≥ 4.5:1 for text
10. Do test design in both light mode and system dark preference
