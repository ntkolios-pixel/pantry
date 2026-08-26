# Handoff: Pantry — family meal planner (iOS prototype)

## Overview
Pantry is a mobile app for Shabbat-observant families that plans a week of dinners from the household's own recipes, generates a grocery list of only what's missing, and remembers every eater's likes and dislikes. This bundle covers the full onboarding flow, the home dashboard, and the main app tabs (Plan, Groceries, Prep, Discover, Library, Family).

## About the Design Files
The files here are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy. The task is to **recreate these designs in the target codebase's existing environment** (React Native, SwiftUI, React, etc.) using its established patterns, component library, and navigation. If no environment exists yet, pick the framework that fits the product (a native or React Native mobile app) and implement there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final as of this handoff. Recreate pixel-accurately using the codebase's own primitives. Interactions are real in the prototype (state, editing, navigation) and should be treated as the intended behavior spec.

## Design Tokens

### Color — "the pantry set" (warm neutrals only; no charcoal, no honey-gold)
Surfaces
- White sugar `#FFFFFF` — cards
- Sugar dust `#FFFDF7` — text on syrup buttons; eater-card header bands
- Linen `#FBF8F1` — inset fields (preference textareas)
- Flour `#F4EFE4` — app background
- Crust line `#E4DAC8` — all borders and dashed dividers

Ink & action
- Cocoa ink `#4A3722` — headings, primary text
- Maple syrup `#7A5330` — primary buttons, back chip, "Add to plan"
- Brown sugar `#8A7458` — body/secondary text, "Added" state
- Oat `#B5A68E` — captions, chevrons, meta

Accent
- Toffee `#9A6B45` — step eyebrows, AI Pick, active accents
- Toffee tint `#EFE3D3` — accent backgrounds (AI Pick card)
- Toffee ink `#6B4726` — text on toffee tint

Tags
- Meat `#A25A34` on `#F6E3D7`
- Dairy `#5F7480` on `#E6EDEF`
- Parve `#6E7548` on `#EEEFDC`
- Leftovers `#7B7166` on `#EFEBE4`
- Favorite `#8E5A5C` on `#F6E4E2`
- Prep-ahead `#9A8560` on `#EFE7DA`

Eater card tints (alternating by index, two only)
- `#F2EADB` and `#F0E7D4` — initial-avatar disc fill; header band is always `#FFFDF7`

Shadow: `0 1px 2px rgba(122,83,48,0.06)` on meal cards only.

### Typography
- Display: **Cormorant Garamond**, italic — screen titles (32px welcome / 25px header / 23px / 19px dish names / 17px eater names), weight 400
- UI: **DM Sans** — body 13–14.5px, captions 10.5–12.5px, eyebrows 10.5px/700/0.09em uppercase
- Line-height: 1.1 display, 1.45–1.6 body

### Spacing & shape
- Screen padding: 32–48px (onboarding, centered) / 18px horizontal (app screens), 90px bottom for tab bar
- Block gap: 34px welcome, 18–24px onboarding, 10–14px lists
- Radius: 8px inputs/chips, 10px buttons, 12–14px cards, 50% avatars
- Tap targets ≥ 44px

## Screens / Views

### 1. Welcome
Vertically centered, 48px 32px padding, 34px gaps.
- Title "Welcome to Pantry" (Cormorant italic 32px, cocoa) and subheader "Plan the week. Shop what's missing. Cook what your family loves." (DM Sans 14px, brown sugar, max-width 260px) grouped at 10px gap.
- Three-step list: single bordered group (crust line, radius 12, 1px gaps showing as dividers), each row `#FFFDF7`, 14px padding, 26px cream disc with Cormorant italic numeral, left-aligned 12.5px brown-sugar copy:
  1. A week of dinners, built around your recipes
  2. A grocery list of only what you're missing
  3. Every eater's likes and dislikes remembered
- Primary CTA "Get started" — full width, syrup, `#FFFDF7` text, 13px vertical padding, radius 10.
- Text link "I already have an account" (12.5px brown sugar, underlined).

### 2. Signup — "Step 1 of 4"
Centered. Toffee eyebrow, Cormorant italic 24px "Create your account", name/email/password inputs (white, crust border, radius 8), syrup CTA, 11.5px oat legal line.

### 3. Household — "Step 2 of 4"
"Who are you cooking for?" — editable member rows (name + age), add-member affordance, syrup continue CTA.

### 4. Eaters / preferences — "Step 3 of 4"
"Tell us about your eaters." One card per member: white card, radius 14, overflow hidden.
- Header band: `#FFFDF7`, 11px 13px, bottom crust border, 30px initial disc (alternating `#F2EADB`/`#F0E7D4`, cocoa Cormorant italic initial), name in Cormorant italic 17px cocoa, age right-aligned 10.5px oat.
- Body: 12px 13px padding, linen textarea (crust border, radius 8, 13px brown-sugar text, 3 rows), placeholder "Likes, dislikes, allergies…".

### 5. Recipes — "Step 4 of 4"
"Add a few recipes." Text input + add button; added recipes list as white rows with "Added" meta.

### 6. Home (post-onboarding, first run)
Sticky header (flour background, dashed bottom border, 64px top inset): syrup 32px back/avatar chip, Cormorant italic 25px greeting "Good evening, {firstName}", subtitle "{firstName}'s Pantry".
First-run body: "You're all set up{, name}" + summary of recipe/eater counts, syrup CTA "Build my first week", secondary white CTA to Library.
Returning body: stat cards (icon beside number), then a dashed-divider nav list — This week's menu / Recipe library / Discover more / Eating preferences — each with an oat chevron.

### 7. Plan — header "Your Pantry, this week" (no subtitle on this tab)
Day cards: white, radius 14, crust border, soft syrup shadow. Day label 12.5px/700, kosher tag chip top-right, dish name, optional "KIDS GET" note (toffee tint), optional "✦ STEALTH VEG" line, skip/undo state on crust-line background.
AI Pick card: toffee-tint background, "✦ AI PICK" 12px/700 toffee + "from your Sunday bases", dish, note, and a syrup "+ Add to plan" button that becomes brown-sugar "✓ Added".
Shabbat/holiday section: guest count is an inline-editable number beside the header and drives the meal cards; each course's dish text is inline editable.

### 8. Groceries / Prep / Discover / Library / Recipe detail / Family
Same shell: sticky header with "← Home"/"← Back", white cards on flour, dashed dividers between list rows, syrup for any primary action. Family tab reuses the eater card from step 4 (its own compact variant with a 28px disc).

## Interactions & Behavior
- Onboarding is linear: welcome → signup → household → eaters → recipes → home. Every secondary screen has a back affordance; the header title map falls back to home when a tab has no entry.
- All preference notes, dish names, guest counts, and member fields are inline-editable and persist in app state immediately.
- "Build my first week" generates the plan and moves to the Plan tab.
- AI Pick: "+ Add to plan" toggles to "✓ Added"; a "next suggestion" action cycles the suggestion list and resets the added flag.
- Skipping a day swaps the dish row for a skip label with an "Undo" action.
- Tab bar highlights the active tab in cocoa ink, inactive in oat.
- No animations beyond default state swaps; keep transitions under 200ms if added.

## State Management
- `tab` — active screen key (home | plan | groceries | prep | discover | library | family | detail)
- `setupStep` — onboarding position
- `signupName / signupEmail / signupPassword`
- `familyMembers[]` — { id, name, age }; `familyNotes{}` — id → free text
- `setupRecipes[]` — { id, title }
- `aiIndex`, `aiAdded` — AI Pick cycling and added flag
- `shabbatGuests`, per-course dish overrides
- `skipped{}` — day key → skip reason
- No network calls in the prototype; all data is local. Real implementation needs recipe CRUD, household CRUD, plan generation, and grocery-list diffing against pantry contents.

## Assets
None external. Fonts are Google Fonts (Cormorant Garamond, DM Sans). The photo placeholder component used in Add Recipe is a prototype-only drag-and-drop stand-in — replace with the codebase's image picker/upload.

## Files
- `PhoneApp.dc.html` — the entire app: all screens, state, and styling
- `Meal Planner.dc.html` — wrapper that mounts the app inside an iOS device frame
- `Color Palettes.dc.html` — the approved palette reference sheet (source of truth for tokens above)
- `ios-frame.jsx`, `image-slot.js`, `support.js` — prototype scaffolding only; do not port
