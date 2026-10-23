# Reddit Account Health Tracker

The **Reddit Account Health Tracker** is fully implemented and tested according to the specifications in [`prompt.md`](file:///Users/fil/Fil/reddit-tracker/prompt.md).

### What Was Built

1. **Authentication & Multi-Account Management**
   - User registration and login ([`app/register/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/register/page.tsx), [`app/login/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/login/page.tsx)) using bcrypt password hashing and HTTP-only session cookies via [`lib/auth.ts`](file:///Users/fil/Fil/reddit-tracker/lib/auth.ts).
   - Add multiple Reddit accounts on the dashboard ([`app/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/page.tsx)) or manage each individually on its dedicated account view ([`app/accounts/[id]/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/accounts/[id]/page.tsx)).

2. **Automated Post Tracking**
   - **Post Link Extraction**: [`parsePostUrl`](file:///Users/fil/Fil/reddit-tracker/lib/reddit.ts#L11-L35) parses and normalizes Reddit URLs, automatically extracting the subreddit name while rejecting short/invalid links.
   - **Local Time Support**: Time picker ([`PostedAtInput`](file:///Users/fil/Fil/reddit-tracker/components/client.tsx#L94-L112)) and display ([`LocalTime`](file:///Users/fil/Fil/reddit-tracker/components/client.tsx#L50-L53)) format timestamps according to the user's browser timezone.
   - **Quick Post Logger**: [`LogPostForm`](file:///Users/fil/Fil/reddit-tracker/components/log-post-form.tsx) on both the main dashboard and account details page.

3. **Subreddit Classification & Crosspost Linking**
   - **Classification Flow**: Whenever a new subreddit is detected in a post link, users are prompted at [`app/subreddits/[id]/classify/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/subreddits/[id]/classify/page.tsx) to classify it:
     - **Main subreddit**: Primary content hub for original posts.
     - **Crosspost subreddit**: Destination for crossposting.
   - **Subreddit Manager**: [`app/subreddits/page.tsx`](file:///Users/fil/Fil/reddit-tracker/app/subreddits/page.tsx) visualizes which crosspost subreddits each main subreddit feeds into, with manual link/unlink controls and reclassification.
   - **Automatic Linking**: Crossposts logged within 24 hours of an original post on the same account are automatically linked to that main subreddit.

4. **Account Health & Spacing Calculations**
   - Implemented in [`lib/safety.ts`](file:///Users/fil/Fil/reddit-tracker/lib/safety.ts):
     - **Dynamic Spacing**: Base 60-minute gap, expanding +30 minutes for each recent post within 24 hours (capped at 6 hours).
     - **Account Warmup**: Double spacing intervals for accounts with fewer than 10 logged posts.
     - **Rolling 24h Hard Cap**: Enforces a maximum of 6 posts in any rolling 24-hour window.
     - **Subreddit Cooldown**: Enforces a 24-hour break before posting to the same subreddit from the same account.
     - **Clear Explanations**: Details the exact anti-spam factors driving each account's interval.
     - **Live Status Badges**: [`SafeStatus`](file:///Users/fil/Fil/reddit-tracker/components/client.tsx#L68-L86) provides a live countdown timer (*"Wait 1h 45m"*) or confirms *"Safe to post"*.

---

# Comprehensive Testing Guide

This guide walks you through verifying every component of the Reddit Account Health Tracker, from automated unit testing to end-to-end interactive scenarios in the browser.

---

## 1. Prerequisites & Environment Setup

### 1.1 Verify Node.js, pnpm & Dependencies
Make sure project dependencies are installed using `pnpm`:
```bash
pnpm install
```

### 1.2 Verify PostgreSQL Database & Prisma Schema
The application requires a PostgreSQL instance. The local connection string is configured in [`.env`](file:///Users/fil/Fil/reddit-tracker/.env):
```env
DATABASE_URL="postgresql://fil@localhost:5432/reddit_tracker?schema=public"
```

Verify that the database is running and the Prisma migrations are applied:
```bash
pnpm exec prisma migrate status
```
If the database needs to be created or synced:
```bash
pnpm exec prisma migrate deploy
```

---

## 2. Automated Test Suite (Vitest)

The automated test suite in [`lib/safety.test.ts`](file:///Users/fil/Fil/reddit-tracker/lib/safety.test.ts) validates the core anti-spam algorithms, safe interval computations, account warm-up rules, and Reddit URL parser.

### 2.1 Run All Tests
Execute the tests once:
```bash
pnpm test
```

Expected output:
```text
 ✓ lib/safety.test.ts (11 tests)
   ✓ computeSafety (8)
     ✓ is safe with no posts
     ✓ uses the base gap after a single post on an established account
     ✓ doubles gaps for warming-up accounts
     ✓ widens the gap as posts pile up in 24h
     ✓ blocks until the rolling 24h cap clears
     ✓ tracks per-subreddit cooldowns
     ✓ caps gap at maxGapMinutes
     ✓ keeps newest cooldown when same subreddit posted multiple times
   ✓ parsePostUrl (3)
     ✓ extracts and normalizes
     ✓ handles uppercase and extra slashes
     ✓ rejects non-post links

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

### 2.2 Run Tests in Watch Mode (Optional)
If you want tests to re-run automatically upon editing files:
```bash
pnpm run test:watch
```

---

## 3. Production Build & Lint Checks

Before testing manually in the browser, verify that the Next.js production build and TypeScript type-checking pass without warnings or errors.

### 3.1 Run Linter
```bash
pnpm run lint
```
*Expected: Clean exit with code 0.*

### 3.2 Run Production Build
```bash
pnpm run build
```
*Expected: Successful Turbopack build with Partial Prerendering and static generation.*

---

## 4. Manual End-to-End Walkthrough

Follow this step-by-step workflow to verify the tracker end-to-end in your browser.

### 4.1 Start the Development Server
```bash
pnpm dev
```
Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

---

### Step 1: User Registration & Session Auth

1. When visiting `http://localhost:3000` unauthenticated, you will be redirected to [`/login`](http://localhost:3000/login).
2. Click **Create one** or go to [`/register`](http://localhost:3000/register).
3. Register a test account:
   - **Email**: `user@example.com`
   - **Password**: `password123` (at least 8 characters)
4. Click **Create account**.
5. **Expected result**:
   - You are redirected to the main dashboard [`/`](http://localhost:3000/).
   - The navigation header displays `Post Spacer`, `Accounts`, `Subreddits`, your email `user@example.com`, and a **Log out** button.
   - An empty state appears: *"No Reddit accounts added yet"*, detailing the anti-spam rules.

---

### Step 2: Adding Reddit Accounts

1. In the **Add Account** form on the dashboard:
   - Input: `growth_pilot` (or `u/growth_pilot`)
   - Click **Add Account**.
2. Add a second account:
   - Input: `founder_daily`
   - Click **Add Account**.
3. **Expected result**:
   - Summary metric bar shows:
     - **Total Accounts**: `2`
     - **Ready to Post**: `2`
     - **In Cooldown**: `0`
     - **24h Total Posts**: `0`
   - Both account cards appear with:
     - `u/growth_pilot` and `u/founder_daily`
     - Badge: `● Safe to post`
     - Badge: `Warmup (0/10)` (since accounts have fewer than 10 posts)
     - Next safe post: `Safe now`
     - Cooldown interval: `0 minutes`
     - Link: `History & Details →`
   - A **Log a Post** form appears at the top with an account picker dropdown.

---

### Step 3: Logging an Original Post & Subreddit Classification

1. On the dashboard in the **Log a Post** card:
   - **Reddit URL**: `https://www.reddit.com/r/SideProject/comments/1example/my_first_saas_showcase/`
   - **Account**: Select `u/growth_pilot`
   - **Posted at**: Leave as current time (or pick a time within the last 15 minutes)
   - Click **Log post**.
2. **Expected result - Automatic Redirection to Classification**:
   - Because `r/SideProject` has never been seen before, the app immediately redirects to:
     `/subreddits/<id>/classify?post=<postId>`
   - The page displays:
     - Title: *"What kind of subreddit is r/SideProject?"*
     - Details about the post just logged for `u/growth_pilot`.
3. Select **Main Subreddit (Original Posts)**:
   - *"Where you regularly make original posts. This serves as your primary content source."*
4. Click **Save Classification**.
5. **Expected result**:
   - You are redirected to the account detail page: [`/accounts/<id>`](http://localhost:3000/accounts).
   - `u/growth_pilot` now displays:
     - Status: `⏳ Wait 1h 45m` (or countdown from 2 hours)
     - Next Safe Time: Exactly 2 hours after the post timestamp
     - Interval Gap: `120 minutes` (60m base gap doubled due to warmup phase)
     - Reason bullet: *"Account is still warming up (1/10 posts logged), so gaps are doubled."*
     - Active Subreddit Cooldown: `r/SideProject` listed with cooldown until 24 hours after the post timestamp.
     - Post history table lists the post with:
       - Subreddit badge: `r/SideProject [Main]`
       - Link to Reddit
       - Localized timestamp
       - Delete button

---

### Step 4: Logging a Crosspost & Automatic Crosspost Linking

The specification requires:
> *"When a crosspost is logged, link its subreddit to the main subreddit of the same account's most recent original post (within the previous 24 hours)."*

1. On the account page or dashboard, log a second post for `u/growth_pilot`:
   - **Reddit URL**: `https://www.reddit.com/r/SaaS/comments/2example/crossposting_our_launch/`
   - **Account**: `u/growth_pilot`
   - **Posted at**: Current time
   - Click **Log post**.
2. **Expected result**:
   - Redirects to `/subreddits/<id>/classify?post=<postId>` for `r/SaaS`.
3. Select **Crosspost Subreddit (Crossposts Only)**:
   - *"Where you only crosspost existing submissions."*
4. Click **Save Classification**.
5. Now click **Subreddits** in the top navigation bar to go to [`/subreddits`](http://localhost:3000/subreddits).
6. **Expected result - Automatic Link Created**:
   - Under **Main Subreddits (Original Posts)**:
     - `r/SideProject` has a badge `1 Main`
     - Under **Linked Crosspost Channels**: `r/SaaS` is displayed with an `×` remove button!
   - Under **Crosspost Subreddits**:
     - `r/SaaS` is displayed with **Receives Crossposts From**: `r/SideProject`.

---

### Step 5: Testing Safety Spacing & Anti-Spam Expansion

To test how intervals expand to prevent spam detection:

1. Look at `u/growth_pilot` on the dashboard:
   - It now has 2 posts within 24 hours.
   - Formula:
     - Base gap: 60m
     - Burst penalty: +30m for the second recent post = 90m
     - Warmup doubling: 90m × 2 = **180 minutes (3 hours)**.
   - Reasons list shows:
     - *"2 posts within 24h of the last one widen the gap."*
     - *"Account is still warming up (2/10 posts logged), so gaps are doubled."*
2. Look at **Subreddit 24-Hour Cooldowns**:
   - Both `r/SideProject` and `r/SaaS` are listed with their individual 24-hour expiration times.
3. Check `u/founder_daily`:
   - It still shows `● Safe to post` because tracking and safe intervals are strictly isolated per account.

---

### Step 6: Testing Manual Subreddit Linking & Reclassification

1. Navigate to [`/subreddits`](http://localhost:3000/subreddits).
2. **Manual Linking**:
   - Scroll to **Link Main & Crosspost Subreddits** form at the bottom.
   - You can link any Main subreddit to any Crosspost subreddit manually.
3. **Unlinking**:
   - On the `r/SideProject` card, click the small `×` next to `r/SaaS`.
   - The link is immediately deleted and the UI refreshes.
4. **Reclassifying**:
   - Click **Change type** next to `r/SaaS`.
   - You can reclassify it from Crosspost to Main or vice versa.

---

### Step 7: Post & Account Deletion (Cascade Cleanup)

1. Open [`/accounts/<id>`](http://localhost:3000/accounts) for `u/growth_pilot`.
2. Scroll to the **Post History** table.
3. Click **Delete** next to one of the posts:
   - A confirmation dialog appears. Confirm deletion.
   - The post is removed from PostgreSQL.
   - The safe interval gap immediately recalculates and reduces.
4. Click **Delete Account** at the top right:
   - Confirm deletion.
   - The account and all associated posts are removed.
   - You are redirected back to the dashboard.

---

### Step 8: Log Out & Session Invalidation

1. Click **Log out** in the top navigation bar.
2. Verify that:
   - The session cookie is invalidated and removed.
   - You are redirected to `/login`.
   - Attempting to navigate directly to `/` or `/subreddits` redirects back to `/login`.

---

## 5. Visual Database Inspection (Prisma Studio)

If you wish to view or inspect the underlying database records in PostgreSQL directly via a graphical interface:

```bash
pnpm exec prisma studio
```
This opens [http://localhost:5555](http://localhost:5555), where you can inspect:
- **`User`**: Account records and hashed credentials.
- **`Session`**: Active hashed tokens and expiry dates.
- **`RedditAccount`**: Tracked accounts scoped to each user.
- **`Subreddit`**: Subreddit directory with `MAIN` or `CROSSPOST` enum values.
- **`SubredditLink`**: Many-to-many links between main and crosspost subreddits.
- **`Post`**: Logged posts with foreign keys to account and subreddit.
