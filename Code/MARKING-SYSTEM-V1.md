# Marking System — Legacy vs V1 (Angular portal)

**The full specification lives in the React portal repo:**
`WeVOISMain-React/MARKING-SYSTEM-V1.md`

Read it before changing anything that touches `EntityMarkingData`. It covers the
data model, the invariants that silently break if ignored, and the cross-app test
plan. What follows is only this repo's part.

## How the switch works here

Route-level guard — no page file checks the flag itself:

`Code/src/app/services/marker/marking-version.guard.ts`
(`settingPath = "Settings/markingManagementSystem"`, `readTimeoutMs = 5000`)

Every marking-related page is registered twice, as `page` and `page-v1`, and the
guard redirects between them. In `admin-layout.routing.ts`: 72 `canActivate`
entries, 30 `-v1` paths. 20 v1 components are declared in
`admin-layout.module.ts`; 18 are routed pages, while `ActionHistoryV1Component`
and `MarkerMoveProgressV1Component` are child components, as their legacy twins
are. On a failed or slow read the guard does **not** redirect — the user stays
where they are.

**This Angular is old.** The guard deliberately uses only `Promise<boolean>`,
plain `subscribe`/`unsubscribe` and `router.navigate` — no `UrlTree`, no RxJS
operators. Do not add libraries or touch `package.json` in this repo; it breaks
the build.

## Shared v1 service

`Code/src/app/services/marker/marker-mapping.service.ts` is the root-level
singleton every v1 page uses for the new structure: uid lookups, the mapping
nodes, `LineSummary`, backups, moves, deletes, and a record cache.

- Its cache is a **singleton**, so it survives page navigation. After a write,
  use `clearForPath(path, patch)` (patches the cache, zero extra reads) or
  `dropMarker(uid)` / `clearLinks()`. Reserve `clearLinkCache()` for a real reset
  such as changing ward — it throws away every record, which can mean thousands
  of reads.
- `removeMarker(db, uid)` is the **only** correct way to delete: record plus all
  three mapping nodes in one atomic `update()`, then `marksCount` down by
  transaction. Deleting just the record leaves an orphan mapping and the marker
  shows up everywhere with blank fields.
- `writeCardMapping(db, cardNo, uid, ward, line)` writes the card link as
  `markerKey` — **camelCase**. See the main doc; the wrong spelling fails
  silently.

## Local notes

- `move-helper-v1.service.ts` is the v1 twin of `move-helper.service.ts`. It
  deliberately **omits** `reserveMarkerKeys` / `getMaxMarkerKey` /
  `raiseLastMarkerKey`: v1 has no per-line key space, so there is nothing to
  reserve and `lastMarkerKey` is global and only grows. Never port a legacy fix
  that reserves per-line keys.
- The four move pages (`line-marker-mapping-v1`, `line-card-mapping-v1`,
  `change-line-marker-data-v1`, `change-line-surveyed-data-v1`) move a marker by
  rewriting mapping only — the record keeps its uid and its image name. Their
  per-marker `state` object is declared **outside** the retry loop on purpose, so
  a network retry still knows what was already written; the `...Checked` flags
  exist so "what was there before" is captured only on the first attempt.
- `manage-marking-data-v1` is **intentionally disabled** — the legacy page is an
  obsolete one-time tool writing the dead `Markers/M{n}` and `WardLineMapping`
  nodes. Its message still points at the deleted "Marker Data Move" page and
  should point at the React migration page.
- There is **no migration page in this repo**. It and a cloud function that did
  the same job were deleted, because both would have duplicated every marker the
  React page migrates.
- `cms1-v1`'s `getAllMarkersOldShape()` keys its third level by **uid**, because
  no v1 record has a `markerNo` field. Requiring that field skips every marker
  silently — see invariant 2 in the main doc.
