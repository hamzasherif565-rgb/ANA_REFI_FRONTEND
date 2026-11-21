# ANA REFI — Complete Features Documentation

> _From Village To The World._ Bilingual (AR/EN) rural-tourism marketplace for village stays,
> experiences, handmade products and community competitions in Egypt.

---

## 1. Home Page (`/`)

**Sections & components**

- **Hero section** — brand logo, headline, tagline, primary CTAs (Explore, Become a host), background imagery.
- **Quick category tiles** — Stays, Experiences, Products, Competitions with icons and deep links.
- **Featured section** (`FeaturedSection.tsx`) — up to 3 admin-selected featured products pulled live from the `listings` table (`is_featured = true`, `status = 'active'`).
- **Contact section** (`ContactSection.tsx`) — validated contact form writing to `contact_messages` (name / email / message with length limits).
- **Footer** (`Footer.tsx`) — navigation links, brand, social/contact info.
- **Global navbar** (`AppNavbar.tsx`) — logo, desktop nav, mobile drawer + bottom nav, search entry, language toggle (AR/EN with RTL flip), dark/light theme toggle, notifications bell, favorites, dashboard / sign-in entry.
- **AI chat widget** (`ChatWidget.tsx`) — floating bilingual assistant on every page.

**Features**

- Fully dynamic content (no hardcoded listings).
- RTL/LTR aware layout and typography.
- Responsive: mobile bottom nav, tablet grid, desktop wide layout.
- SEO head tags (title, description, OG, Twitter card) per route.

---

## 2. Explore Pages — Stays / Experiences / Products (`/stays`, `/experiences`, `/products`)

Powered by the shared `ListingGallery.tsx` component.

- **Live data** from `listings` filtered by `type` and `status = 'active'` via React Query.
- **Search** — free-text search over title (AR + EN) and location.
- **Filters** — category chips, price awareness, discount badges.
- **Sorting** — newest, price low→high, price high→low.
- **Cards** (`ListingCard.tsx`) — cover image, title, location, price, discount badge, rating, favorite (heart) toggle, link to details.
- **Pagination** (`Pagination.tsx`).
- **Loading / empty / error states** for every fetch.
- **Favorites toggle** directly from the card, synced to the database.

---

## 3. Competitions (`/competitions`)

- Reference-matching layout: category sidebar (Horse Riding, Agriculture, Pottery, …), search, status tabs.
- **Competition cards** (`CompetitionCard.tsx`) — image, title, start/end dates, location, prize amount, entry fee, participants count/capacity, status badge, "Join now" CTA.
- Statuses: draft, upcoming, open, closed, completed, cancelled — drafts are hidden from the public.
- Featured & "coming soon" flags.
- Hosts create and manage competitions from the Host Dashboard.

---

## 4. Experience / Listing Details (`/listing/$id`)

- **Image gallery** — large cover, prev/next arrows, thumbnail strip.
- Type badge (stay / experience / product / competition) + category chip.
- Title, location, full description (bilingual fields `title_en` / `description_en`).
- **Price block** — original price, discount percentage, final price.
- **Interactive location map** (`LocationMap.tsx`) — responsive embedded map centred on the listing's location with a marker.
- **Reviews** — star rating (1–5), text comment, optional photo upload, author name, date; post-review form for signed-in users; instant cache invalidation.
- **Booking form** — date picker + guests, live total calculation (stays & experiences).
- **Buy form** — quantity + total (products).
- **Join form** — one-click entry (competitions).
- **Save to favorites** and **Share to community** actions.
- Prev / next listing navigation.
- Sign-in prompt for guests.

---

## 5. Booking Flow

1. Choose date and guests on the listing page — the total updates live.
2. **Book now** creates a `bookings` row (`status = 'pending'`, amount, guests, date, listing + host references).
3. The user is redirected automatically to the **Payment page**.
4. Database triggers create notifications for both the traveler and the host.
5. The host confirms / cancels / completes the booking from the Host Dashboard; every status change notifies the traveler.

---

## 6. Payment Page (`/payment/$bookingId`)

- **Booking summary panel** — listing cover image, selected experience name, date, number of guests, and total price.
- **Payment method selection** — Credit card, Debit card, Visa, Mastercard, Cash (optional).
- **Card form** — card holder name, card number (auto-formatted in 4-digit groups), expiry date (MM/YY mask), CVV.
- **Validation** — card number length (13–19 digits), expiry pattern & valid month, CVV 3–4 digits, required holder name.
- **Cash option** — explains pay-on-arrival and leaves the booking pending until the host confirms.
- **Processing state**, then a **success confirmation screen** with a check icon, booking reference, total paid, and a button back to the booking confirmation (Traveler Dashboard).
- Card details are never persisted; only the booking status is updated (`confirmed`).
- Fully responsive two-column → stacked layout.

---

## 7. Authentication

| Route              | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `/auth`            | Sign in / quick sign up + Google, with links to the dedicated sign-up pages |
| `/signup/traveler` | Dedicated **Traveler** registration                                         |
| `/signup/host`     | Dedicated **Host** registration with identity verification                  |
| `/onboarding/role` | Role picker for first-time (e.g. Google) users                              |

**Traveler sign up** — First name, Last name, Email, Mobile phone, Password, Confirm password, plus **Sign up with Google**. Validations: all required fields, email format, Egyptian mobile format (`01x xxxxxxxx` / `+201x…`), password ≥ 8 characters, password confirmation match.

**Host sign up** — First name, Last name, Email, Mobile phone, **National ID number (14 digits)**, **Front side of National ID upload**, **Back side of National ID upload**, Password, Confirm password, plus **Sign up with Google** (after Google the form keeps only the verification step). Validations: all of the above plus 14-digit National ID and both ID images required.

**Identity document storage** — uploads go to the **private** `identity-docs` storage bucket under a per-user folder. Storage policies allow a user to read/write only their own folder; admins may read all. The record (`host_verifications`) holds first name, last name, national ID, both file paths, review status and timestamps.

**Other auth features**

- Passwords handled entirely by the auth service (hashed, never stored by the app).
- Google OAuth via the managed Lovable broker (works inside the editor preview and in production).
- Email confirmation flow with clear "check your email" messaging.
- Profile row, contact row and role rows created automatically on signup by a database trigger.
- Role gate (`RoleGate.tsx`) routes first-time users to role selection, then to the right dashboard; returning users skip it.
- Sign out clears the React Query cache.

---

## 8. Traveler Dashboard (`/dashboard`)

- Greeting with display name and account type.
- **Bookings tab** — all bookings with resolved listing titles, dates, guests, amount, status badges, cancel action.
- **Favorites tab** — saved stays, experiences, products and competitions.
- **Notifications tab** — recent activity.
- **Stats** — number of bookings, favorites, total spend.
- Quick links to explore pages and "become a host".
- Sign out.

---

## 9. Host Dashboard (`/host`)

- **Host-only access** (travelers are redirected).
- **Create / edit / delete listings** for **stays, experiences, products and competitions**, each with its own field set (price, discount, capacity, category, location, dates, bilingual title/description).
- **Multi-image upload** (`ImageUploader.tsx`, up to 6 images) through Laravel's listing-image upload API.
- **Publish / unpublish** listings (status toggle).
- **Booking management** — see every booking on the host's listings with guest name, phone (via the restricted `user_contacts` table), date, guests, amount; confirm, cancel or complete.
- **Financial statistics** — total revenue, pending revenue, bookings count, listings count, average booking value.
- "Become a host" upgrade path for existing travelers.
- Instant UI refresh on every mutation via React Query invalidation.

---

## 10. Admin Dashboard (`/admin`)

- **Opens directly — no login page or login requirement.**
- **Featured products** — feature/unfeature products shown on the Home page, capped at 3.
- **User moderation** — user table with name, phone, account type, status; block / unblock users.
- Live counts and instant refresh after each action.
- All previously existing admin functionality is preserved.

---

## 11. Community (`/community`)

- Dynamic feed from `community_posts` joined with author profiles.
- Post title, body, optional image, author name and timestamp.
- Posts can be created from a listing's **Share** action.
- Owners and admins can delete their posts.

---

## 12. Chat — AI Assistant

- Floating widget available on every page (`ChatWidget.tsx`).
- Bilingual (Arabic / English) responses following the active locale.
- Powered by a server function (`src/lib/ai-chat.functions.ts`) through the Lovable AI gateway — no client-side API key.
- Message history within the session, typing indicator, error handling.

---

## 13. Notifications (`/notifications`)

- Live list of the signed-in user's notifications (booking confirmed, booking status change, competition update, new message, system).
- Unread badge in the navbar.
- Mark all as read; delete own notifications.
- Generated automatically by database triggers on booking insert/status change.

---

## 14. Reviews

- Star rating 1–5, comment (max 500 chars), optional photo.
- Anyone can read reviews; only signed-in users can post; authors and admins can edit/delete their own.
- Shown on the listing detail page with author and date.

---

## 15. Favorites (`/favorites`)

- Heart toggle on cards and detail pages.
- Works across listings and competitions.
- Owner-only visibility, instant optimistic refresh (`useFavorites.ts`).
- Dedicated favorites page grouped by type with links back to the item.

---

## 16. Profile & Settings

- Profile record: display name, avatar URL, bio, account type, role-selected flag, blocked flag.
- Phone numbers live in the private `user_contacts` table (never publicly readable).
- Language preference (AR/EN) and theme preference (dark/light) persisted in **local storage**.
- Role is permanent after selection; only an admin can change it.

---

## 17. Responsive Design

- Mobile-first Tailwind layout with `sm` / `md` / `lg` breakpoints throughout.
- Mobile: bottom navigation bar, drawer menu, single-column stacks, safe bottom padding.
- Tablet: two-column grids.
- Desktop: wide max-width containers, sidebar layouts (competitions, listing details, checkout).
- Fluid images, responsive embedded map, horizontally scrollable thumbnail strips and tables.

---

## 18. Dark Mode

- Full dark/light theme via `src/lib/theme.tsx`, toggled from the navbar and remembered in local storage.
- All colors are semantic design tokens (OKLCH leaf greens + warm creams) declared in `src/styles.css` — no hardcoded color utilities, so both themes stay consistent.

---

## 19. APIs & Server Logic

- **TanStack Start server functions** (`src/lib/*.functions.ts`) — AI chat, competitions helpers.
- **Laravel REST API** from the browser client for authentication and CRUD operations, guarded by Laravel authorization policies and middleware.
- **Laravel file uploads** for listing images and private identity documents.
- **Lovable AI gateway** for the chat assistant.
- **Embedded maps** for listing locations.

---

## 20. Database

| Table                | Purpose                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `profiles`           | Display name, avatar, bio, account type, role-selected, blocked flag                                    |
| `user_contacts`      | Private phone numbers (owner / admin / booking host only)                                               |
| `user_roles`         | `user` / `host` / `admin` roles, checked via the `has_role` function                                    |
| `host_verifications` | Host first/last name, national ID, ID image paths, review status                                        |
| `listings`           | Stays, experiences and products (bilingual, images, price, discount, capacity, dates, featured, status) |
| `competitions`       | Competitions with prize, entry fee, capacity, participants, status                                      |
| `bookings`           | Bookings/orders/entries with date, guests, amount, status                                               |
| `reviews`            | Ratings, comments and photos per listing                                                                |
| `favorites`          | Saved items per user                                                                                    |
| `notifications`      | Per-user activity notifications                                                                         |
| `community_posts`    | Community feed                                                                                          |
| `contact_messages`   | Home page contact form submissions                                                                      |

**Database logic** — Laravel migrations, models, controllers, and authorization middleware manage profiles, bookings, notifications, and role checks.

**Security** — Laravel authentication tokens, role middleware, owner-scoped authorization, admin checks, and protected identity document uploads.

---

## 21. Local Storage

- Language / locale preference (AR ↔ EN and RTL direction).
- Theme preference (dark / light).
- Auth token and current user (managed by the Laravel API client).

---

## 22. Technologies Used

- **React 19** + **TypeScript**
- **TanStack Start v1** (file-based routing, SSR, server functions) + **TanStack Router**
- **TanStack React Query** (caching, invalidation, loading/error states)
- **Vite 7**
- **Tailwind CSS v4** with semantic OKLCH design tokens
- **shadcn/ui** components + **lucide-react** icons + **sonner** toasts
- **Laravel API** — authentication, database access, authorization, and file storage
- **Lovable AI gateway** — chat assistant
- Custom lightweight **i18n** layer (AR/EN, RTL aware)

---

## 23. Folder Structure

```
src/
  assets/                 brand assets (logo)
  components/
    ui/                   shadcn primitives
    AppNavbar.tsx         global navigation + language/theme toggles
    ChatWidget.tsx        AI assistant
    CompetitionCard.tsx   competition card
    ContactSection.tsx    home contact form
    FeaturedSection.tsx   featured products
    Footer.tsx            site footer
    ImageUploader.tsx     multi-image upload
    ListingCard.tsx       listing card
    ListingGallery.tsx    search + filter + sort gallery
    LocationMap.tsx       responsive map with marker
    Logo.tsx              ANA REFI logo
    Pagination.tsx        pagination control
    RoleGate.tsx          first-login role routing
  hooks/                  useCurrentUser, useProfile, useFavorites, use-mobile
  integrations/           Laravel API client and auth middleware
  lib/
    i18n.tsx              bilingual dictionary + RTL
    theme.tsx             dark/light theme provider
    listings.ts           listing mappers/helpers
    queryKeys.ts          central React Query key factory
    uploadImage.ts        listing image upload
    uploadIdentity.ts     private national-ID upload
    validation.ts         email / Egyptian phone / national ID / password rules
    ai-chat.functions.ts  AI assistant server function
  routes/
    __root.tsx            shell: providers, navbar, footer, chat, role gate
    index.tsx             Home
    stays.tsx experiences.tsx products.tsx competitions.tsx community.tsx
    listing.$id.tsx       listing details, map, reviews, booking
    payment.$bookingId.tsx checkout + success screen
    auth.tsx              sign in
    signup.traveler.tsx   traveler registration
    signup.host.tsx       host registration + ID verification
    onboarding.role.tsx   role picker
    dashboard.tsx         traveler dashboard
    host.tsx              host dashboard
    admin.tsx             admin dashboard (no login required)
    favorites.tsx notifications.tsx
  styles.css              design tokens & theme
```

---

## 24. Future Improvements

- Real payment gateway integration (Paddle / Stripe / Fawry) replacing the simulated checkout.
- Admin review queue UI for pending host verifications with ID image preview.
- Geocoded coordinates per listing for pin-accurate maps and map-based search.
- Realtime chat between travelers and hosts.
- Availability calendar and double-booking prevention.
- Coupons, loyalty points and referral programme.
- Push / email notifications and invoice PDFs.
- Multi-currency pricing and more languages.
- Analytics dashboards for hosts and admins.
- Automated end-to-end tests for the booking → payment flow.
