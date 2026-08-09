**Design QA: Disponible card**

- Source visual truth: `C:/Users/MARCOS~1/AppData/Local/Temp/codex-clipboard-0c5bd2ff-4df8-4075-982d-d4c9bc742147.png`
- Source dimensions: 327 x 193 px.
- Desktop implementation evidence: `.next/design-qa/available-card-desktop.png`
- Mobile implementation evidence: `.next/design-qa/available-card-mobile.png`
- Side-by-side comparison: `.next/design-qa/available-card-comparison.png`
- Desktop component size: 360 x 190 CSS px at device scale 1.
- Mobile viewport: 375 x 500 CSS px at device scale 1.
- Mobile component size: 327 x 190 CSS px; measured `scrollWidth` 325 px, with no horizontal overflow.
- State: positive monthly availability with fixed 39%, recurring 17%, and investment 11%.

**Full-view comparison evidence**

The implementation preserves the reference hierarchy: solid dark-blue featured surface, small uppercase label, large monetary value, positive status indicator, segmented allocation bar, and compact percentage legend. The card is intentionally wider in the dashboard because it spans two KPI columns and acts as the primary monthly-flow metric.

The previous-month comparison badge and comparison copy are intentionally omitted because the requested product state does not include comparisons yet.

**Focused region comparison evidence**

The side-by-side component comparison confirms the value typography, border treatment, status color, allocation colors, bar proportions, and legend density. A focused comparison was required because these details are too small to assess reliably from a full dashboard capture.

**Required fidelity surfaces**

- Fonts and typography: Geist Mono is used for the label and monetary value to match the reference's compact financial display. Weight, hierarchy, and decimal sizing are preserved.
- Spacing and layout rhythm: internal padding, value-to-bar spacing, legend spacing, radius, and border weight match the reference while supporting the wider dashboard slot.
- Colors and visual tokens: dark navy surface, blue border, emerald status, amber fixed costs, cyan recurring costs, violet investments, and slate remainder align with the source and existing app theme.
- Image quality and assets: no raster assets or non-standard icons are required for this data card; all visible elements are native financial UI controls and text.
- Copy and content: the primary label is `Disponible`; comparisons are omitted; percentages are calculated from current monthly income.

**Comparison history**

- Initial P2: the implementation rendered `1443,20` without the Spanish thousands separator. Fixed by applying deterministic dot grouping, producing `1.443,20 €`.
- Initial P3: spacing before the decimal portion was wider than the reference. Fixed by removing the extra margin and applying the mono display font.
- Post-fix evidence: `.next/design-qa/available-card-comparison.png` and `.next/design-qa/available-card-mobile.png`.

**Verification**

- Desktop and 375 px mobile states rendered successfully.
- No browser console errors were reported.
- No primary interaction is attached to this informational card.
- TypeScript validation passed.

final result: passed
