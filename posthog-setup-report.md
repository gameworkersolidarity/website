# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Game Worker Solidarity Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 15.3+ approach)
- **Server-side PostHog client** for API route tracking
- **Reverse proxy configuration** to avoid ad blockers (routes through `/notes`)
- **Automatic exception capture** for error tracking
- **12 custom events** tracking user interactions across forms, search, filters, and navigation

## Events Implemented

| Event Name                        | Description                                                          | File                                                 |
| --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `action_submitted`                | User successfully submits an action through the submission form      | `src/app/(frontend)/submit/ActionSubmissionForm.tsx` |
| `action_submission_failed`        | User's action submission fails with an error (client-side)           | `src/app/(frontend)/submit/ActionSubmissionForm.tsx` |
| `search_performed`                | User performs a search using the global search bar                   | `src/components/SearchBar.tsx`                       |
| `search_result_selected`          | User selects a result from the search dialog                         | `src/components/SearchBar.tsx`                       |
| `filter_applied`                  | User applies a filter to the action list                             | `src/app/(frontend)/components/ActionFilter.tsx`     |
| `filter_cleared`                  | User clears a filter from the action list                            | `src/app/(frontend)/components/ActionFilter.tsx`     |
| `navigation_link_clicked`         | User clicks a navigation link in the mobile menu                     | `src/app/(frontend)/components/Header.tsx`           |
| `mobile_menu_opened`              | User opens the mobile hamburger menu                                 | `src/app/(frontend)/components/Header.tsx`           |
| `api_docs_clicked`                | User clicks to view the API documentation                            | `src/app/(frontend)/data/DataPage.client.tsx`        |
| `graphql_playground_clicked`      | User clicks to access the GraphQL playground                         | `src/app/(frontend)/data/DataPage.client.tsx`        |
| `related_action_clicked`          | User navigates to a related action (previous, next, or same day)     | `src/app/(frontend)/actions/[slug]/ActionPage.tsx`   |
| `action_submission_created`       | Server-side: A new action submission is successfully created via API | `src/app/api/submit/route.ts`                        |
| `action_submission_failed_server` | Server-side: Action submission fails on the API                      | `src/app/api/submit/route.ts`                        |

## Files Created/Modified

### New Files

- `instrumentation-client.ts` - Client-side PostHog initialization
- `src/lib/posthog-server.ts` - Server-side PostHog client helper

### Modified Files

- `next.config.mjs` - Added PostHog reverse proxy rewrites
- `src/app/(frontend)/submit/ActionSubmissionForm.tsx` - Added submission tracking
- `src/components/SearchBar.tsx` - Added search tracking
- `src/app/(frontend)/components/ActionFilter.tsx` - Added filter tracking
- `src/app/(frontend)/components/Header.tsx` - Added navigation tracking
- `src/app/(frontend)/data/DataPage.client.tsx` - Added API docs click tracking
- `src/app/(frontend)/actions/[slug]/ActionPage.tsx` - Added related action tracking
- `src/app/api/submit/route.ts` - Added server-side submission tracking

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard

- [Analytics basics](https://eu.posthog.com/project/121183/dashboard/506269) - Main analytics dashboard

### Insights

- [Action Submissions Over Time](https://eu.posthog.com/project/121183/insights/1xCe9SVn) - Track successful vs failed submissions
- [Search Activity](https://eu.posthog.com/project/121183/insights/Q6iqIi7T) - Monitor search behavior and result selection
- [Filter Usage by Type](https://eu.posthog.com/project/121183/insights/9hwOBDHw) - See which filters are most popular
- [Submission Success Funnel](https://eu.posthog.com/project/121183/insights/VC5Hrt4L) - Track conversion from page views to submissions
- [User Engagement - Related Actions](https://eu.posthog.com/project/121183/insights/FfqVLYDC) - Monitor user exploration patterns

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Environment Variables

The following environment variables are required (already configured in your `.env` file):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_QJduTbZPJVhxIqnWCEZqIRR9T83VOGczqoE0hQH0H0Q
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Make sure to add these to your production environment (Vercel, Netlify, etc.) as well.
