# GIMISCO Premium Website — Static HTML/CSS/JavaScript

A responsive black-and-gold corporate website for GIMISCO GLOBAL INVESTMENT LIMITED. Built for static hosting on Vercel or GitHub Pages; no build command is required.

## Included pages
- `index.html` — homepage, service overview, capability gallery, and latest Supabase media
- `about.html` — company profile and principles
- `sectors.html` — service categories
- `projects.html` — capability imagery and latest uploaded media
- `why-us.html` — engagement approach
- `contact.html` — contact details and email enquiry form
- `admin.html` — private Supabase-authenticated media management portal

## Quick local preview
Open this folder in VS Code and use Live Server, or run a local static server. For example, with Python installed:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/` and `http://localhost:5500/admin.html`.

## Supabase setup
1. Open your Supabase project and confirm the `media` table, `gimisco_admins` table and `gimisco-media` Storage bucket exist.
2. If needed, review/run `sql/supabase-setup.sql` in the SQL Editor. The file uses conditional policy creation to avoid dropping existing policies.
3. In Supabase Project Settings/API or the Connect panel, copy the project URL and the **publishable/anon** key into `supabase-config.js`.
4. Never place a service-role or secret key in browser JavaScript.
5. In Authentication > Users, create an admin account. Copy its Auth user UUID and insert it into `public.gimisco_admins`:

```sql
insert into public.gimisco_admins (user_id) values ('YOUR-AUTH-USER-UUID');
```

6. In Supabase Authentication URL Configuration, set the Site URL to the deployed website origin and add the local preview and production URLs to allowed redirect URLs as appropriate.
7. Test `/admin.html`, upload an image and a video, then verify they appear in the homepage/project gallery.

The admin page does not contain a default password. Authentication is handled by Supabase; admin authorization is controlled by `gimisco_admins` and RLS policies.

## Deploy to Vercel
1. Extract the ZIP.
2. Upload/commit the **contents** of this folder to your existing GitHub repository (keep the HTML files in the repository root, not nested one folder deeper).
3. In Vercel, select the existing project and ensure the Root Directory points to the folder containing `index.html`. Use the static/no-framework setup, leave Build Command empty, and set Output Directory to `.` if the project asks for it.
4. Deploy. Test the homepage and `/admin.html` on the same deployed domain.

## Content and imagery
The portfolio images included in `assets/projects/` are capability/illustrative imagery, not claims of verified named client projects. No unverified awards, clients, statistics, certifications or project results have been added. Contact details are the ones supplied for GIMISCO.

## Notes
- The contact form opens the visitor's email application; it does not store submissions in a database.
- The public media gallery is populated from the Supabase `media` table after configuration. It degrades gracefully when Supabase is not configured.
- The site loads Google Fonts and Supabase JS from CDNs; an internet connection is needed for those services.
