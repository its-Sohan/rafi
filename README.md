# Hisab — online service and print shop counter

A working UI prototype for a single shop and selling device. Built with React, TypeScript, and Vite, with Cloudflare Workers Static Assets configuration.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. For the production build, including offline reopening:

```sh
npm run build
npm run preview
```

The service worker is enabled in production only. Load the production preview online once and allow the application shell to finish caching before going offline. English and Bangla fonts are bundled locally.

## Design

- Off-white canvas, white square panels, dark text, one blue focus accent.
- Swiss-inspired typography and grid: DM Sans, clear hierarchy, restrained labels, right-aligned numeric columns, IBM Plex Mono for prices and keys.
- Hand-drawn SVG pixel pictograms for services and the shop mark. Business text stays crisp and readable.
- Always-visible service catalog beside the bill; independent scrolling keeps payment on screen at laptop and desktop sizes.
- A focused payment dialog, consistent focus return, keyboard shortcut footer, and a Bangla/English switch. Noto Sans Bengali is bundled for Bangla.

## Try the keyboard flow

The first launch starts with an empty bill and 39 example services for a Bangladeshi online computer shop. They cover printing and photocopying, document typing and CV design, job and admission applications, government forms, and everyday digital assistance. Prices and estimated costs are illustrative; enter your shop's rates before live use. Official government, admission, and portal fees are separate from the listed service charges. Receipts are saved on this device.

Prints and photocopies are charged per page; lamination is per sheet, passport photos per set, and applications per job. Search by English or Bangla name, common Banglish terms, or code such as `PR101` (black and white PDF print), `DC203` (CV design), or `AP303` (university admission application).

1. Press **F2**, enter `PR101`, and press **Enter**.
2. Enter `20` and press **Enter** to add 20 black and white printed pages.
3. Search for `DC203` and add one CV design. Services do not use inventory stock.
4. Press numpad **+** to open payment, enter the amount received, and press **Enter**.
5. The receipt is saved before success is displayed; press **Enter** again for the next sale.

| Key | Action |
| --- | --- |
| F2 | Focus service search |
| ↑ / ↓ | Move through services or focused bill |
| Enter | Select service, add quantity, or confirm the focused form |
| + | Open payment |
| Alt+B | Focus the bill |
| Enter in bill | Edit selected quantity |
| Delete in bill | Remove selected line, with temporary Undo |
| Esc | Close dialog or return to service search |
| Tab / Shift+Tab | Reach all other controls |
| ? outside an input | Open shortcut guide |

## Implemented

- Code/name search across print, document, application, government, and digital service categories; old custom products remain usable.
- Per-page, per-sheet, per-set, and per-job billing uses whole quantities. Existing physical products retain their original units and stock behavior.
- Bill editing, removal/undo, fixed discounts, customer selection, cash/mobile/bank payment recording, change, and customer dues.
- Integer money and scaled quantities, with rounding at the line boundary.
- IndexedDB drafts and receipts; serialized writes and atomic sale/draft transition. A failed save leaves the draft intact.
- Local receipt history, stock reduced by physical product sales, service charges without stock tracking, customer balances, daily totals using Asia/Dhaka, receipt printing, JSON backup export, and sales CSV export.
- Existing browser data migrates on the next load. Previous receipts, customer dues, user-added products, and non-demo draft lines are retained; the old prefilled sample bill is cleared. Former built-in hardware items referenced by a saved bill or receipt are archived with their original prices.
- Production service worker caches the application and fonts for offline reopening. The cashier still records sales in IndexedDB.
- Responsive layouts for 1366×768, 1920×1080, and a stacked small-screen view.

## Verification

```sh
npm run build
npm test
```

Model tests cover catalog integrity, quantities, payments, service billing, custom product stock movement, customer dues, search, and migration of saved browser data. The browser flow should be checked with both interface languages after changing the catalog.

## Next phase

This is a local UI prototype. The catalog is bundled in `src/model.ts`, and shop data is saved in the browser's `hisab-counter` IndexedDB database. There is no authentication, server API, or cloud synchronization. A D1 database is named in `wrangler.jsonc`, but the app has no Worker code that reads or writes it. No sample customers are created for new workspaces. This counter records fees and receipts; it does not actually prepare files, submit forms, or process payments.

Connect the tested UI to an authenticated Worker API and D1. Add a durable outbox in the same IndexedDB transaction as each sale, a unique operation ID, and idempotent server commits for receipt, payment, and stock records. Surface pending/failed synchronization and keep historical price snapshots. Backend work should preserve the existing keyboard and focus behavior.

For a static Cloudflare preview, build first, then use the Wrangler CLI with `wrangler.jsonc`. Publishing and creating Cloudflare resources are separate from this local prototype. This configuration serves static assets; add Worker code to use the existing D1 binding when implementing the backend.

Local data belongs to this browser and origin; export a backup before clearing browser storage. Different preview ports have separate demo workspaces. Settings shows when offline reopening is ready.
