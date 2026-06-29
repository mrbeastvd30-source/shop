# shop

## Shared products for the admin panel

The admin panel saves products through `/api/products`. On Vercel, add this environment variable so products added by the admin become visible to every user:

- `GITHUB_TOKEN` — GitHub personal access token with permission to update this repository contents.

Optional variables:

- `ADMIN_PASSWORD` — defaults to `1986`
- `GITHUB_REPO` — defaults to `mrbeastvd30-source/shop`
- `GITHUB_BRANCH` — defaults to `main`
- `GITHUB_PRODUCTS_PATH` — defaults to `products.json`
