The **Drafts feature** has been implemented.

### What Was Built

1. **Database & Migration**
   - Added the [`Draft`](prisma/schema.prisma) model linked to [`User`](prisma/schema.prisma) and optional [`RedditAccount`](prisma/schema.prisma) with support for `title`, `body`, `linkUrl`, `targetSubreddit`, and `notes`.
   - Created and applied migration [`prisma/migrations/20261024073049_add_drafts/migration.sql`](prisma/migrations/20261024073049_add_drafts/migration.sql).

2. **Server Actions**
   - Implemented [`createDraft`](app/actions.ts), [`updateDraft`](app/actions.ts), and [`deleteDraft`](app/actions.ts) in [`app/actions.ts`](app/actions.ts).

3. **Interactive UI & Quick-Copy Actions**
   - **Dedicated Drafts Page**: Added at [`app/drafts/page.tsx`](app/drafts/page.tsx) with real-time search, account/subreddit filtering, and a collapsible draft creator.
   - **One-Click Copy**: Built [`CopyButton`](components/drafts-client.tsx) into every draft card to copy:
     - 📋 **Title** (for the Reddit title input)
     - 📋 **Body** (for the post text / markdown)
     - 📋 **Link** (if draft has a URL)
     - 📋 **All** (formatted title + content together)
     - ↗ **Open Reddit**: Pre-fills Reddit's submit form directly via [`buildRedditSubmitUrl`](lib/drafts.ts).
   - **Dashboard & Account Integration**:
     - Added navigation link in [`app/layout.tsx`](app/layout.tsx).
     - Added [`RecentDraftsWidget`](components/drafts-client.tsx) to both the main dashboard ([`app/page.tsx`](app/page.tsx)) and individual account view ([`app/accounts/[id]/page.tsx`](app/accounts/[id]/page.tsx)).

4. **Tests & Housekeeping**
   - Added unit tests in [`lib/drafts.test.ts`](lib/drafts.test.ts) (all 19 tests passing).
   - Cleared the `## Task` section in [`prompt.md`](prompt.md) per rule #2.