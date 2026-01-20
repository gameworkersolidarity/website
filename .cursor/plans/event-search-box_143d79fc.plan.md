---
name: event-search-box
overview: Add a fuzzy full-text search input in the EventList filter bar that filters events via context, using the existing Fuse.js dependency and a string-flattened search index over all event fields.
todos: []
---

# Event Search Plan

## Context

- The filters UI renders inside `EventList` when `showFilter` is true, and the filter bar container is the `div` with `px-4 py-3 border-t border-b border-gray-200` that currently wraps `EventFilter`. We will insert the search control here.
- `EventFilterContextProvider` already computes `filteredEvents` with the active filter selections; we will extend this to apply the new text search before returning the list.
```64:82:/Users/jan/dev/gwsp/src/components/EventList.tsx
  <header className="mt-1 sticky top-6 bg-background pt-3 z-40">
    <div className="px-4 flex flex-col @xl:flex-row justify-between gap-2 @xl:gap-4 pb-2">
      <!-- existing header content -->
    </div>
    {showFilter && (
      <div className="px-4 py-3 border-t border-b border-gray-200">
        <EventFilter {...(eventFilterProps || {})} />
      </div>
    )}
  </header>
```


## Plan

- Add search state to the event filter context so components can set/read a `searchQuery` alongside existing filters; include it in `clearAllFilters`.
- Implement a fuzzy search step in `EventFilterContextProvider` using the existing `fuse.js` dependency and a helper that flattens all string values from each event into a single searchable field. This keeps the search scope aligned with “all event fields”.
- Capture Fuse match data and expose a `highlights` map keyed by event id, with ranges per field, so the UI can emphasize matched text.
- Update `EventFilter` to render an expand-on-click search control with a magnifying-glass icon, and wire it to the context `searchQuery`. The input remains visible when non-empty, and clearing it restores the full filtered list.
- Pass highlight metadata into the event list/card components via an optional `highlights` prop, and render simple `<mark>`-style emphasis for matching substrings in visible fields (title/description/labels).
- Ensure the search UI sits within the specified filter bar container and remains responsive alongside the existing filter controls.

## Files to change

- [`/Users/jan/dev/gwsp/src/components/EventFilterContextProvider.tsx`](/Users/jan/dev/gwsp/src/components/EventFilterContextProvider.tsx)
  - Add `searchQuery` and `setSearchQuery` to context.
  - Add `buildEventSearchText()` helper (deep-flatten strings from event objects) and apply Fuse search in `filteredEvents` memo.
  - Collect Fuse match ranges into a `highlightsByEventId` map for UI consumption.
- `[/Users/jan/dev/gwsp/src/app/(frontend)/components/EventFilter.tsx](/Users/jan/dev/gwsp/src/app/\\\\\\\(frontend)/components/EventFilter.tsx)`
  - Add search button + expandable input UI in the top filter row.
  - Bind input value to context `searchQuery`.
- [`/Users/jan/dev/gwsp/src/components/EventCard.tsx`](/Users/jan/dev/gwsp/src/components/EventCard.tsx)
  - Accept optional `highlights` prop and render marked text for matched ranges in title/description/labels.
- [`/Users/jan/dev/gwsp/src/components/CompactEventList.tsx`](/Users/jan/dev/gwsp/src/components/CompactEventList.tsx) and [`/Users/jan/dev/gwsp/src/components/EventsTimeline.tsx`](/Users/jan/dev/gwsp/src/components/EventsTimeline.tsx) (if needed)
  - Thread `highlights` into list renderers so cards have access to match ranges.

## Package choice justification

- Use `fuse.js` because it is already included in dependencies, is small and browser-friendly, and provides fuzzy matching with configurable thresholds—ideal for typo-tolerant “full text” search without adding new packages.

## Todos

- add-search-context: Extend filter context with `searchQuery` state and updater.
- fuse-search-filter: Build Fuse search pipeline and collect match ranges.
- search-ui: Add expand-on-click search input in `EventFilter`.
- highlight-ui: Add optional `highlights` prop to cards and render marks.
- qa: Verify search filters and highlights match text.