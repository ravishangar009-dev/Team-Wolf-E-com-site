# Project Memory

## Core
- **Platform**: Team Wolf Supplement — single-shop gym supplement e-commerce (dark theme, red accents).
- **Tech Stack**: Supabase (Auth, DB, Storage, Edge Functions, RLS enforced), PWA.
- **Roles**: Access controlled via DB tables (`user_roles`, `store_admins` for temp access, `delivery_agents`).
- **Auth**: Primary login is Phone OTP (Fast2SMS) mapped to synthetic emails. No social auth.
- **Design**: Mobile-first, dark gym theme, red/black Wolf branding, Outfit + Inter fonts.
- **Payments**: UPI deep linking with manual verification (user uploads transaction proof).
- **Orders**: Status flow: UPI_PENDING → Pending → Accepted → Out for Delivery → Delivered.
- **Single Shop**: No multi-store browsing. "Shop Now" goes directly to all products page.
- **Audit Trail**: All product changes (add/edit/delete) by temp admins are logged in `product_audit_log`.

## Memories
- [Theme Identity](mem://design/theme-identity) — TeamWolf yellow/black branding, neomorphic cards, floating animations.
- [Mobile-First UX](mem://design/mobile-first-ux) — Touch-friendly interfaces, responsive layouts, mobile bottom navigation bar.
- [Phone OTP System](mem://auth/phone-otp-system) — Fast2SMS Quick Transactional OTP login with synthetic email fallback and 60s cooldown.
- [Global Admin Dashboard](mem://features/global-admin) — Platform-wide management, data cleanup tools, site maintenance, and product offers.
- [Admin Temp Access](mem://features/admin-temp-access) — Temp admins manage products with full audit trail; replaces store admin concept.
- [Delivery Agent System](mem://features/delivery-agent-system) — Agent portal, automated Haversine assignment, live tracking with scooter icon and 30s GPS updates.
- [Order Lifecycle](mem://features/order-lifecycle) — Order statuses, UPI manual verification, Haversine ETA, and email notifications.
- [User Profiles & Onboarding](mem://features/user-profiles-onboarding) — Mandatory profile completion, local storage 3-step guide, custom avatar events.
- [Product Management](mem://features/product-management) — Store offers, unlisted product WhatsApp requests, global store search.
- [Delivery Fee System](mem://features/delivery-fee-system) — ₹10/km based on Haversine distance, min ₹10 fee.
- [Store Operating Hours](mem://features/store-operating-hours-enforcement) — Admin-managed hours (default 7AM-10PM) block cart/checkout when closed.
- [Store Feedback System](mem://features/store-feedback-system) — 5-star ratings and text comments with admin moderation.
- [PWA Installation](mem://features/pwa-installation) — Progressive Web App config with manifest and custom mobile install prompt.
- [Advertisement Gallery](mem://features/advertisement-gallery) — Auto-sliding (4s) banner managed by admins with context-aware call buttons.
- [Web Push Notifications](mem://features/notifications/web-push) — VAPID Web Crypto API in Deno, handled via sw.js service worker.
