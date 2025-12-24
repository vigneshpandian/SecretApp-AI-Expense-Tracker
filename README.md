<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jj8V2LAGwcIidJwFhxqVzQQmEJwSVUJe

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` and `VITE_BASE_URL` in [.env.local](.env.local) for local development or [.env.production](.env.production) for production builds. Use your Gemini API key and the appropriate API base URL.
3. Run the app:
   `npm run dev`

For production builds, run `npm run build -- --mode production` to use the production environment variables.
