# shop

## Shared products for the admin panel

The admin panel saves products through `/api/products`. On Vercel, add this environment variable so products added by the admin become visible to every user:

- `GITHUB_TOKEN` — GitHub personal access token with permission to update this repository contents.
- `OPENAI_API_KEY` — OpenAI API key used only on the server to translate product descriptions between Uzbek and Russian.

Optional variables:

- `ADMIN_EMAIL` — defaults to `sabinastyle77@gmail.com`
- `SUPABASE_URL` — defaults to the configured Sabina Style Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` — defaults to the configured public browser key
- `GITHUB_REPO` — defaults to `mrbeastvd30-source/shop`
- `GITHUB_BRANCH` — defaults to `main`
- `GITHUB_PRODUCTS_PATH` — defaults to `products.json`
- `OPENAI_TRANSLATION_MODEL` — defaults to `gpt-5.4-mini`

The admin writes the product description in the currently selected site language. When the product is saved, `/api/translate` creates the second language version and both descriptions are stored with the product. The OpenAI key is never sent to the browser.

Registration email ownership is verified with Supabase email OTP. Product writes and AI translation requests require a valid Supabase access token belonging to `ADMIN_EMAIL`.
