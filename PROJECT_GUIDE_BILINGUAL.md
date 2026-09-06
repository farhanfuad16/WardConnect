# WardConnect Project Guide

## English + বাংলা নির্দেশিকা

**Project name:** WardConnect — Ward-Level Smart Citizen & Emergency Response App  
**Project type:** React Native + Expo mobile application  
**Project folder:** `/home/ubuntu/ward-connect`  
**Checkpoint version:** `f03fb6f2`

> This guide explains what has been created, where the important files are located, how to run the project, and which parts are implemented or still pending.
>
> এই নির্দেশিকায় প্রজেক্টে কী তৈরি করা হয়েছে, কোন ফোল্ডার ও ফাইলে কী আছে, কীভাবে প্রজেক্ট চালাতে হবে, এবং কোন ফিচার সম্পন্ন বা অসম্পূর্ণ—সবকিছু ব্যাখ্যা করা হয়েছে।

---

## 1. What has been built

### English

WardConnect is a portrait-oriented civic mobile app for residents of a city-corporation ward. The current mobile MVP focuses on fast citizen actions and clear emergency communication. It includes a home dashboard, issue reporting form, SOS flow, report tracking, verified incident awareness, resource directory, notices, in-app notifications, volunteer interest, and profile screens.

The current implementation uses **local demo data** from `lib/ward-data.ts`. The screens and navigation are functional, but the mobile MVP is not yet connected to a production MySQL REST API, Cloudinary, real authentication, or a separate admin web dashboard.

### বাংলা

WardConnect হলো সিটি কর্পোরেশনের একটি ওয়ার্ডের বাসিন্দাদের জন্য তৈরি একটি portrait-oriented civic mobile app। বর্তমান mobile MVP-এর মূল লক্ষ্য হলো দ্রুত নাগরিক রিপোর্ট পাঠানো এবং জরুরি পরিস্থিতির তথ্য পরিষ্কারভাবে দেখানো। এতে Home dashboard, সমস্যা রিপোর্ট, SOS flow, রিপোর্ট tracking, verified incident map, resource directory, notices, in-app notifications, volunteer interest এবং profile screen তৈরি করা হয়েছে।

বর্তমান সংস্করণে `lib/ward-data.ts` ফাইলের **local demo data** ব্যবহার করা হয়েছে। অর্থাৎ screen ও navigation কাজ করে, কিন্তু এখনো production MySQL REST API, Cloudinary, বাস্তব authentication বা আলাদা admin web dashboard-এর সঙ্গে সংযুক্ত করা হয়নি।

---

## 2. Main user flow

| English flow | বাংলা ব্যাখ্যা |
|---|---|
| Home → Report an issue | Home থেকে নাগরিক category, description এবং landmark দিয়ে রিপোর্ট শুরু করতে পারে। |
| Home → Send an SOS | Fire, Flood, Medical, Accident বা Security নির্বাচন করে SOS confirmation-এর মাধ্যমে জরুরি রিপোর্ট পাঠানোর flow আছে। |
| Reports → Report detail | নিজের রিপোর্টের tracking ID, status, location এবং timeline দেখা যায়। |
| Map → Verified incident | Map screen-এ verified public incidents দেখা যায়; raw/unverified citizen report দেখানো হয় না। |
| Map → Resources | Ambulance, responder, generator এবং shelter-এর মতো স্থানীয় resource search করা যায়। |
| Notices → Notifications | Ward notice feed এবং unread/read notification center আছে। |
| Incident detail → I can help | Verified incident-এর জন্য volunteer interest জানানো যায়; automatic dispatch করা হয় না। |
| Profile | Citizen name, email, phone, ward এবং logout option দেখা যায়। |

---

## 3. Project folder structure

```text
ward-connect/
├── app/                         # Expo Router screens and navigation
├── assets/images/               # App icon, splash, favicon, Android assets
├── components/                  # Reusable UI components
├── constants/                   # Theme and constant values
├── hooks/                       # Reusable React hooks
├── lib/                         # Shared data, theme, utilities, API helpers
├── server/                      # Template backend/server support files
├── shared/                      # Shared server/client types and constants
├── drizzle/                     # Template database migration/schema files
├── scripts/                     # Development and asset utility scripts
├── tests/                       # Automated tests
├── app.config.ts                # Expo app configuration and branding
├── package.json                 # Dependencies and project commands
├── pnpm-lock.yaml               # Exact dependency lockfile
├── design.md                    # Mobile interface design plan
├── todo.md                      # Feature checklist and remaining work
├── theme.config.js              # Brand colors used by NativeWind
├── tailwind.config.js           # NativeWind/Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── PROJECT_GUIDE_BILINGUAL.md  # This guide
```

### বাংলা folder explanation

| Folder / file | English purpose | বাংলা অর্থ |
|---|---|---|
| `app/` | All mobile screens and Expo Router routes. | সব mobile screen এবং navigation route এখানে থাকে। |
| `assets/images/` | App icon, splash icon, favicon and Android icon files. | App icon, splash screen ও Android branding assets থাকে। |
| `components/` | Reusable visual components such as safe-area container and icons. | বারবার ব্যবহারযোগ্য UI component থাকে। |
| `constants/` | Theme exports and application constants. | Theme ও স্থায়ী constant value থাকে। |
| `hooks/` | Custom React hooks such as colors and authentication helpers. | reusable React hook থাকে। |
| `lib/` | Shared application data, utilities, theme provider and API helpers. | shared data, helper function ও theme logic থাকে। |
| `server/` | The scaffold’s server-side support files. | template-এর backend/server support code থাকে; custom MVP এখনো live API হিসেবে ব্যবহৃত নয়। |
| `shared/` | Code shared between client and server. | client ও server-এর মধ্যে shared type/constant থাকে। |
| `drizzle/` | Database migration and schema scaffold. | database migration/schema scaffold থাকে। |
| `scripts/` | QR, environment and asset utility scripts. | development utility script থাকে। |
| `tests/` | Automated test files. | automated test file থাকে। |

---

## 4. Important `app/` files

### English

| File | What it does |
|---|---|
| `app/_layout.tsx` | Root navigation layout. It registers the tab group, report routes, SOS, notifications, and detail screens. |
| `app/(tabs)/_layout.tsx` | Defines the five bottom tabs: Home, Reports, Map, Notices, and Profile. |
| `app/(tabs)/index.tsx` | Home screen. Shows the welcome header, ward, quick actions, active emergency, latest notices, notification badge, and 999 reminder. |
| `app/(tabs)/reports.tsx` | My Reports screen. Displays report IDs, categories, dates, and statuses. |
| `app/(tabs)/map.tsx` | Incident and resource screen. It shows verified incident cards, a visual ward map mockup, markers, legend, and searchable resources. |
| `app/(tabs)/notices.tsx` | Notices feed for emergency, utility, and general notices. |
| `app/(tabs)/profile.tsx` | Profile screen with citizen information, preferences, and logout feedback. |
| `app/report/new.tsx` | Submit Report form with category chips, description validation, landmark field, location-ready state, photo-ready state, and submission confirmation. |
| `app/report/[id].tsx` | Report detail screen with description, location, current status, and timeline. `[id]` means a dynamic route. |
| `app/sos.tsx` | SOS screen with five emergency categories, location-ready state, confirmation dialog, and 999 guidance. |
| `app/notifications.tsx` | In-app notification center with unread badge state and Read all action. |
| `app/incident/[id].tsx` | Verified incident detail screen with severity, location, response timeline, and I can help action. |
| `app/oauth/callback.tsx` | Template OAuth callback route. It is part of the scaffold and is not the primary citizen flow in the current MVP. |
| `app/dev/theme-lab.tsx` | Development theme preview screen supplied by the template. |

### বাংলা ব্যাখ্যা

`app/` ফোল্ডারের প্রতিটি `.tsx` ফাইল একটি screen বা navigation layout। Expo Router ফাইলের নাম দেখে route তৈরি করে। যেমন `app/report/[id].tsx`-এ `[id]` থাকার অর্থ হলো যেকোনো report ID দিয়ে detail screen খোলা যাবে।

---

## 5. Important `lib/`, `components/`, and theme files

| File | English explanation | বাংলা ব্যাখ্যা |
|---|---|---|
| `lib/ward-data.ts` | Main local demo data: user, reports, notices, incidents, and resources. | demo user, reports, notices, incidents এবং resources-এর data এখানে আছে। |
| `lib/theme-provider.tsx` | Provides theme context to the app. | পুরো app-এ theme context দেয়। |
| `lib/_core/theme.ts` | Builds the runtime color palette. | runtime color palette তৈরি করে। |
| `lib/utils.ts` | Utility functions such as class name merging. | class name merge করার helper আছে। |
| `hooks/use-colors.ts` | Returns the current theme colors. | বর্তমান theme-এর color দেয়। |
| `components/screen-container.tsx` | Safe-area-aware outer container used by screens. | notch, status bar এবং safe area ঠিক রাখতে screen wrapper হিসেবে ব্যবহৃত হয়। |
| `components/haptic-tab.tsx` | Adds haptic-style behavior to tab buttons. | tab button-এর interaction feedback দেয়। |
| `components/ui/icon-symbol.tsx` | Maps icon names to Material Icons. | screen-এ ব্যবহৃত icon name-গুলো Material Icons-এর সঙ্গে map করে। |
| `theme.config.js` | WardConnect palette: teal, coral, mist background, amber, green, and slate. | WardConnect brand color এখানে define করা হয়েছে। |
| `tailwind.config.js` | Connects the theme tokens to NativeWind classes. | theme color-কে NativeWind/Tailwind-এর সঙ্গে যুক্ত করে। |
| `global.css` | Global NativeWind styles. | global NativeWind style থাকে। |

### Brand colors

| Token | Hex | Usage / ব্যবহার |
|---|---|---|
| Deep teal | `#0F766E` | Main buttons, civic actions, active tabs |
| Dark ink | `#102A2A` | Heading and primary text |
| Mist | `#F4F8F7` | App background |
| Coral red | `#D9485F` | SOS and emergency states |
| Amber | `#D97706` | Utility notices and warning states |
| Leaf green | `#2F855A` | Resolved and success states |
| Slate | `#64748B` | Secondary text and metadata |

---

## 6. Branding and Expo configuration

### English

`app.config.ts` is the main Expo configuration file. It contains the display name `WardConnect`, slug `ward-connect`, portrait orientation, icon paths, Android package information, web favicon path, and splash configuration.

The branded assets are stored in:

```text
assets/images/icon.png
assets/images/splash-icon.png
assets/images/favicon.png
assets/images/android-icon-foreground.png
```

`app.config.ts` points the app to `assets/images/icon.png` as the main icon and uses the other files for splash, web, and Android adaptive-icon support.

### বাংলা

`app.config.ts` হলো Expo-এর প্রধান configuration file। এখানে app-এর নাম `WardConnect`, slug `ward-connect`, portrait orientation, icon path, Android package এবং splash/web configuration আছে।

Branding asset-গুলো `assets/images/` ফোল্ডারে রাখা হয়েছে। App launcher, splash screen, favicon এবং Android icon-এর জন্য আলাদা asset path configure করা আছে।

---

## 7. How to run the project

### English step-by-step

1. Install **Node.js** and **pnpm** on your computer.
2. Clone or copy the project folder.
3. Open a terminal inside the project folder.
4. Install dependencies:

```bash
pnpm install
```

5. Start the development server:

```bash
pnpm dev
```

6. The web preview can be opened from the URL shown by Expo. For a physical phone, run the Expo link/QR flow and open it with **Expo Go**.
7. To check the code without starting the full app:

```bash
pnpm check
pnpm lint
pnpm test
```

8. The most useful development commands are:

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts the development server and Expo web preview. |
| `pnpm check` | Runs TypeScript validation. |
| `pnpm lint` | Runs Expo ESLint checks. |
| `pnpm test` | Runs Vitest tests. |
| `pnpm android` | Attempts to open the Android Expo flow. |
| `pnpm ios` | Attempts to open the iOS Expo flow. |
| `pnpm qr` | Generates the project QR helper output. |

### বাংলা ধাপে ধাপে

১. কম্পিউটারে **Node.js** এবং **pnpm** install করুন।  
২. Project folder clone বা copy করুন।  
৩. Terminal দিয়ে project folder-এ যান।  
৪. Dependency install করুন:

```bash
pnpm install
```

৫. Development server চালু করুন:

```bash
pnpm dev
```

৬. Browser preview-এর জন্য Expo যে URL দেখাবে সেটি খুলুন। Mobile phone-এ test করতে Expo QR/link flow ব্যবহার করে **Expo Go** দিয়ে খুলুন।  
৭. Code validation-এর জন্য `pnpm check`, `pnpm lint`, এবং `pnpm test` চালান।

---

## 8. How to understand a screen file

A typical screen file has four parts:

1. Imports, such as React Native components, `router`, `ScreenContainer`, icons, and shared data.
2. Local constants, such as brand colors or categories.
3. The component function, which returns the screen UI and defines button behavior.
4. A `StyleSheet.create()` block, which contains the visual styles.

বাংলায় বললে, একটি screen file সাধারণত চারটি অংশে ভাগ করা থাকে: import, local data বা color constant, মূল component function, এবং শেষে `StyleSheet.create()`-এর মধ্যে UI style। কোনো button কোথায় গেলে কী হবে, সেটি সাধারণত `onPress={() => router.push(...)}` বা `Alert.alert(...)`-এর মাধ্যমে লেখা হয়েছে।

---

## 9. What is complete and what remains

| Feature | Current status | Explanation |
|---|---|---|
| Home dashboard | Implemented | Local demo ward status, emergency card, notices, and quick actions. |
| Civic report UI | Implemented | Category selection, description validation, landmark, location-ready state, and confirmation. |
| SOS UI | Implemented | Emergency category selection, confirmation dialog, and 999 reminder. |
| My Reports | Implemented | Demo reports, status pills, detail route, and timeline. |
| Verified incident awareness | Implemented | Only prepared verified incidents appear in the public map/list. |
| Resources | Implemented | Searchable local resource directory. |
| Notices | Implemented | Emergency, utility, and general notice feed. |
| Notifications | Implemented | Unread/read state and Read all interaction. |
| Volunteer interest | Implemented as local interaction | The incident detail screen records the user-facing action through a confirmation interaction. |
| Profile | Implemented | Demo profile data, preferences row, and logout feedback. |
| Authentication | Pending | Login, registration, JWT, bcrypt, and real ward selection have not yet been connected to the mobile flow. |
| Live backend API | Pending | Current UI uses local data in `lib/ward-data.ts`. |
| MySQL persistence | Pending | Database scaffold exists, but the custom MVP screens are not yet wired to production tables. |
| Admin web dashboard | Pending | Not part of the current mobile-only delivery checkpoint. |
| Cloudinary image upload | Pending | The report UI is ready for photo integration, but real picker/upload wiring remains. |
| Real GPS/maps | Pending | The current map is a lightweight visual MVP; Expo Location and live map integration remain follow-up work. |

### বাংলা summary

বর্তমান checkpoint-এ mobile UI এবং user flow-এর বড় অংশ তৈরি হয়েছে। তবে বাস্তব user authentication, MySQL database persistence, live GPS, Cloudinary upload, backend REST API এবং admin dashboard এখনো আলাদা পরবর্তী ধাপ হিসেবে আছে। তাই এটিকে **working mobile MVP / front-end prototype with local demo data** হিসেবে বোঝা সবচেয়ে সঠিক।

---

## 10. Git and teammate workflow

### English

From the project folder:

```bash
git init
git add .
git commit -m "Initial WardConnect mobile MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ward-connect.git
git push -u origin main
```

Create feature branches instead of editing `main` directly:

```bash
git checkout main
git pull origin main
git checkout -b feature/authentication
git push -u origin feature/authentication
```

Recommended team branches are `feature/authentication`, `feature/backend-api`, `feature/admin-dashboard`, `feature/location`, and `feature/testing`. After finishing a feature, push the branch and open a Pull Request. Review it before merging into `main`.

### বাংলা

Project folder থেকে প্রথমে Git initialize করে initial commit করুন। এরপর GitHub repository-র URL যোগ করে `main` branch push করুন। Team member-দের সরাসরি `main` edit না করে আলাদা feature branch ব্যবহার করতে বলুন। কাজ শেষ হলে তারা Pull Request খুলবে, review করার পরে `main`-এ merge করবেন।

---

## 11. Recommended next development order

The safest next sequence is:

1. Add real authentication and ward selection.
2. Add a simple JavaScript Express REST API with MySQL tables.
3. Replace `lib/ward-data.ts` reads with API calls while retaining loading and error states.
4. Add Expo ImagePicker and server-side image upload.
5. Add Expo Location and a real Expo-compatible map.
6. Build the separate admin dashboard for report verification, notices, hazards, resources, volunteers, and analytics.
7. Add deterministic tests for validation, report status transitions, and unread notification behavior.

### বাংলা

পরবর্তী কাজের সবচেয়ে ভালো ক্রম হলো: প্রথমে authentication ও ward selection, তারপর Express + MySQL API, এরপর local demo data-এর বদলে API data, তারপর photo upload, real GPS/map, admin dashboard এবং শেষে আরও unit test। এতে project structure পরিষ্কার থাকবে এবং team-এর কাজ আলাদা branch-এ ভাগ করা সহজ হবে।

---

## 12. Important project files to open first

If you are new to the codebase, open these files in this order:

| Order | File | Why |
|---:|---|---|
| 1 | `README.md` | Understand the base Expo template. |
| 2 | `design.md` | Understand the product’s screen and color decisions. |
| 3 | `todo.md` | See completed and pending work. |
| 4 | `app/(tabs)/index.tsx` | Understand the main user-facing screen. |
| 5 | `lib/ward-data.ts` | Understand the local data used by the current MVP. |
| 6 | `app/(tabs)/_layout.tsx` | Understand bottom-tab navigation. |
| 7 | `app/_layout.tsx` | Understand root routes and modal/detail routes. |
| 8 | `theme.config.js` | Understand the brand palette. |
| 9 | `package.json` | Understand dependencies and commands. |
| 10 | `app.config.ts` | Understand Expo branding and build settings. |

বাংলায়, নতুন developer হলে প্রথমে `design.md`, `todo.md`, `app/(tabs)/index.tsx`, `lib/ward-data.ts`, এবং দুইটি layout file পড়লেই app-এর UI ও navigation দ্রুত বোঝা যাবে।

---

## 13. Final note

This project is intentionally kept understandable for a small university team. It uses Expo Router, TypeScript, React Native, NativeWind styling, local shared data, and straightforward screen-level logic. The next stage should add the real backend incrementally rather than replacing the existing UI architecture all at once.

এই project-টি ছোট university team-এর জন্য সহজে বোঝার মতো করে রাখা হয়েছে। একসঙ্গে পুরো architecture বদলানোর পরিবর্তে বর্তমান UI ও navigation রেখে ধাপে ধাপে backend, authentication, database এবং admin dashboard যুক্ত করা সবচেয়ে নিরাপদ পদ্ধতি হবে।
