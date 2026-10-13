# Privacy policies

Public privacy policies and the account-deletion page for Antonio Friguglietti's Android apps — what Google Play asks
for in the store listing (*Privacy policy URL*) and in the Data safety form (*Delete account URL*).

| Page | URL (GitHub Pages) |
|---|---|
| All apps | https://antfr99.github.io/Privacy-Policy/ |
| My Investments | https://antfr99.github.io/Privacy-Policy/my-investments.html |
| My Entertainment | https://antfr99.github.io/Privacy-Policy/my-entertainment.html |
| Our Timeline | https://antfr99.github.io/Privacy-Policy/our-timeline.html |
| Delete an account | https://antfr99.github.io/Privacy-Policy/delete-account.html |

Contact: frigug@gmail.com

## Hosting

GitHub Pages serves `main` from the repo root (Settings → Pages → Deploy from a branch → `main` / `(root)`). The
repo is public so Pages is free; nothing in it is secret — the Supabase key in `delete-account.html` is the
*publishable* key the apps already ship with.

## Where the text comes from

The three app pages are generated from each app's `src/about.ts` (the About tab), so the app and the web page say the
same thing. After changing an app's About text:

```bash
cd Privacy-Policy
node scripts/build.mjs ..        # the folder that holds Mobile-My-Investments-New, Mobile-My-Entertainment, Mobile-Our-Timeline
git commit -am "Policies: rebuild" && git push
```

`index.html` and the app pages are generated; `delete-account.html` and `assets/style.css` are written by hand.

## How deletion works

`delete-account.html` emails a one-time sign-in code (it never creates an account), checks it, then calls the
`delete_my_account()` database function — the same one the apps' **Delete my account** button calls. It deletes the
signed-in person's account, and every table that belongs to it goes with it (see `supabase/safety.sql` in the
My Investments repo). People can also ask by email.

## Streamlit copy (optional)

`app.py` shows the same pages on Streamlit Community Cloud (main file `app.py`) if you'd rather not make the repo
public. Streamlit apps go to sleep when unused, so GitHub Pages is the better address for Play Console.
