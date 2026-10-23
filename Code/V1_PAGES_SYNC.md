# Legacy ↔ V1 Page Sync List

> Internal developer note — not part of the build (only `src/assets` and `src/favicon.ico` are copied to `dist`).

## Why this list exists

Some pages have two versions:

- **Legacy** – old `MarkedHouses` data structure
- **V1** – new `MarkersData` data structure

Which one a city sees is decided by `Settings/markingManagementSystem` in that city's database
(`true` → V1, `false` / missing → legacy). The redirect is done by
`src/app/services/marker/marking-version.guard.ts`.

**Rule:** whenever you change a legacy page listed below, check whether the same change is needed
on its V1 page (and vice versa). Both versions are live for different cities, so a fix applied to
only one side will be missing for the other cities.

## Pages with a V1 version

| # | Legacy route | Legacy component folder | V1 component folder |
|---|---|---|---|
| 1 | `house-marking` | `src/app/house-survey/house-marking` | `src/app/house-survey/house-marking-v1` |
| 2 | `house-marking-assignment` | `src/app/house-survey/house-marking-assignment` | `src/app/house-survey/house-marking-assignment-v1` |
| 3 | `ward-survey-analysis` | `src/app/house-survey/ward-survey-analysis` | `src/app/house-survey/ward-survey-analysis-v1` |
| 4 | `ward-survey-summary` | `src/app/house-survey/ward-survey-summary` | `src/app/house-survey/ward-survey-summary-v1` |
| 5 | `ward-marking-summary` | `src/app/house-survey/ward-marking-summary` | `src/app/house-survey/ward-marking-summary-v1` |
| 6 | `line-card-mapping` | `src/app/house-survey/line-card-mapping` | `src/app/house-survey/line-card-mapping-v1` |
| 7 | `line-marker-mapping` | `src/app/house-survey/line-marker-mapping` | `src/app/house-survey/line-marker-mapping-v1` |
| 8 | `supervisor-report` | `src/app/house-survey/supervisor-report` | `src/app/house-survey/supervisor-report-v1` |
| 9 | `cms1` | `src/app/cms1` | `src/app/cms1-v1` |
| 10 | `marker-approval-test` | `src/app/marker-approval-test` | `src/app/marker-approval-test-v1` |
| 11 | `change-line-surveyed-data` | `src/app/PortalServices/change-line-surveyed-data` | `src/app/PortalServices/change-line-surveyed-data-v1` |
| 12 | `change-line-marker-data` | `src/app/PortalServices/change-line-marker-data` | `src/app/PortalServices/change-line-marker-data-v1` |
| 13 | `card-marker-mapping` | `src/app/Developers/card-marker-mapping` | `src/app/Developers/card-marker-mapping-v1` |
| 14 | `add-marker-against-cards` | `src/app/Developers/add-marker-against-cards` | `src/app/Developers/add-marker-against-cards-v1` |
| 15 | `manage-marking-data` | `src/app/Developers/manage-marking-data` | `src/app/Developers/manage-marking-data-v1` |
| 16 | `due-amount-report` | `src/app/reports/due-amount-report` | `src/app/reports/due-amount-report-v1` |
| 17 | `collected-amount-report` | `src/app/reports/collected-amount-report` | `src/app/reports/collected-amount-report-v1` |
| 18 | `card-transaction-detail` | `src/app/reports/card-transection-detail` | `src/app/reports/card-transection-detail-v1` |

## Checklist when changing a page in this list

- [ ] Same change applied (or consciously skipped) on the other version
- [ ] Any DB path change mapped correctly — legacy uses the old structure, V1 uses the new one
- [ ] UI/HTML/SCSS changes mirrored if they apply to both
- [ ] Links/navigation inside V1 pages point to `-v1` URLs where possible

## Adding a new V1 page

1. Create the `-v1` component next to the legacy one.
2. Add both routes in `src/app/layouts/admin-layout/admin-layout.routing.ts` (same URL forms as
   legacy, with `-v1` added to the page segment) and put `canActivate: [MarkingVersionGuard]` on both.
3. Add a row to the table above.
