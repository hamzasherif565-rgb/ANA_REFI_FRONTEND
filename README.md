# ANA REF

You are a Senior Full-Stack React Developer, UI/UX Designer, and AI Engineer with over 10 years of experience.

I will provide:

1. A ZIP file containing my complete project.

2. A reference image for the Competition page.

3. My logo image.

Your task is to improve and upgrade the entire project while maintaining the existing functionality. Do NOT break any current features. Refactor the code where necessary and follow React best practices.

## Requirements

### 1. Competition Page

- Recreate the Competition page based on the reference image I provide.

- Match the overall layout, spacing, colors, cards, typography, and modern UI style.

- Make the design cleaner and more professional.

- Keep it fully responsive.

### 2. Notification System

Create a complete notification system.

When a user books:

- Send a notification to the User.

- Send a notification to the Host.

Notifications should include:

- Booking confirmation

- Booking status updates

- Competition updates

- New messages (if applicable)

Create a dedicated Notification Center with a notification icon in the navigation bar.

### 3. Host Competition Management

Allow Hosts to:

- Create competitions

- Edit competitions

- Delete competitions

- Manage participants

- View competition details

- Track registrations

- View competition statistics

### 4. Favorites System

Implement a complete Favorites feature.

Users should be able to:

- Add items to Favorites.

- Remove items from Favorites.

- View all saved items in a dedicated Favorites page.

- Persist favorites using the backend/database.

### 5. Logo Integration

Use the logo image I provide.

Replace the current branding throughout the website with the new logo.

Ensure proper sizing, spacing, responsiveness, and favicon support if applicable.

### 6. Improve the Entire Project

Upgrade the project professionally by:

- Improving the overall UI/UX.

- Better animations and transitions.

- Better loading states.

- Better empty states.

- Better error handling.

- Better accessibility.

- Better performance.

- Better component organization.

- Cleaner folder structure.

- Reusable React components.

- Professional code quality.

### 7. Improve the AI Features

Upgrade the AI functionality by making it:

- Faster

- Smarter

- More accurate

- More context-aware

- Better integrated into the website

- Provide more useful recommendations and responses.

### 8. Redesign the Navigation Bar

Completely redesign the Navbar.

Requirements:

- Modern mobile-first navigation.

- Use icons instead of text where appropriate.

- Smooth animations.

- Better spacing.

- Sticky navbar.

- Responsive behavior.

- Professional appearance.

### 9. Responsive UI

Make every page fully responsive.

IMPORTANT:

Do NOT rely only on CSS media queries.

Use proper React responsive architecture including:

- Responsive React components.

- Flexible layouts.

- Adaptive rendering.

- Mobile-first design.

- Optimized layouts for:

  - Mobile

  - Tablet

  - Laptop

  - Desktop

### 10. General Improvements

Improve every page in the project professionally.

Include:

- Better card designs

- Better typography

- Better buttons

- Better forms

- Better shadows

- Better spacing

- Better color consistency

- Better user experience

- Better animations

- Better accessibility

- Better performance optimization

## Technical Requirements

- Use React best practices.

- Keep the project modular and scalable.

- Optimize performance.

- Write clean, maintainable code.

- Avoid duplicate code.

- Follow modern React architecture.

- Preserve all existing functionality unless an improvement is required.

- Ensure the entire application works without introducing bugs.

The final result should look like a production-ready, enterprise-level web application with a premium user experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bdd22332-46b2-48b2-8125-505727f48fd7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Laravel API

The application data and authentication API is Laravel. Set `VITE_API_BASE_URL` to the Laravel API base (for example `http://127.0.0.1:8000/api/v1`) and set the Laravel `CORS_ALLOWED_ORIGINS` value to the frontend origin. Google sign-in requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Laravel plus a matching `FRONTEND_URL`.

# Laravel API configuration

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` and `API_BASE_URL` to the Laravel API root (including `/api/v1`). The deployed ANA REFI backend is the default when no value is provided.

The shared Laravel transport, bearer-token handling, resource requests, and uploads live in `src/integrations/api/client.ts`. The browser communicates with Laravel endpoints only; API authentication, data, and files are handled by the backend.
