---
description: How to deploy the Career DNA landing page to Vercel
---

Follow these steps to deploy your Next.js application to Vercel.

### 1. Initialize Git and Push to GitHub (Recommended)
Vercel works best with GitHub for automatic deployments on every push.

1.  Initialize git in your project:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on [GitHub](https://github.com/new).
3.  Link your local repo and push:
    ```bash
    git remote add origin <your-github-repo-url>
    git branch -M main
    git push -u origin main
    ```

### 2. Deploy to Vercel
1.  Go to [Vercel](https://vercel.com/new).
2.  Import your GitHub repository.
3.  **Crucial Step: Add Environment Variables**.
    In the "Environment Variables" section, add the following from your `.env.local`:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `GOOGLE_AI_API_KEY`
4.  Click **Deploy**.

### Alternative: Deploy via Vercel CLI
If you don't want to use GitHub, you can deploy directly from your terminal:
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root.
3.  Follow the prompts and add your environment variables when asked or in the Vercel Dashboard later.

### 3. Supabase Setup
Ensure your Supabase project is set up with the schema found in `supabase/schema.sql`.
1.  Go to your [Supabase Dashboard](https://app.supabase.com/).
2.  Open the **SQL Editor**.
3.  Copy and paste the contents of `supabase/schema.sql` and run it.
