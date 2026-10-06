# Srivinayaka-mobileApp

## Setup

1. `cd mobile-app`
2. `npm install`
3. Update `app.json` -> `expo.extra.apiBaseUrl` to backend URL.
4. `npm start`

## Architecture

- `app/` app bootstrap and theme
- `navigation/` auth + tabs + root stack
- `services/api.js` axios instance, auth token injection, retry, GET cache
- `store/` Zustand stores for auth and app state
- `components/` reusable UI blocks
- `screens/` all required app screens
- `utils/` constants/helpers

## API Mapping

- Auth: `/api/users/send-otp`, `/api/users/verify-otp`, `/api/users`
- Home dynamic payload: `/api/app-management/mobile-home`
- Categories: `/api/categories?level=...&showInMobile=...`
- Product listing/search/filter: `/api/products` with query params
- Product details: `/api/products/:id`
- Coupons: `/api/coupons/validate`
- Orders: `/api/orders`, `/api/orders/myorders`, `/api/orders/:id`, `/api/orders/track/:id`
- App settings and admin mobile controls are from `/api/app-management/*`

## QA Checklist (implemented fallback targets)

- Broken image fallback in cards/gallery
- Empty cart state
- Empty product/category states
- API failure retry and error state components
- Coupon validation errors handled in UI
- Checkout failure handling with alert

## Development Phases

- Phase 1: setup + navigation + reusable components
- Phase 2: home/category/product listing
- Phase 3: product details + gallery + similar
- Phase 4: cart + coupon validation
- Phase 5: checkout + order success + tracking
- Phase 6: profile + orders + account screens
- Phase 7: admin-controlled mobile dynamic sections
