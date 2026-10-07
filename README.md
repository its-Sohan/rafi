# Hisab — keyboard-first shop counter

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
- Hand-drawn SVG pixel pictograms for products and the shop mark. Business text stays crisp and readable.
- Always-visible product catalog beside the bill; independent scrolling keeps payment on screen at laptop and desktop sizes.
- A focused payment dialog, consistent focus return, keyboard shortcut footer, and a Bangla/English switch. Noto Sans Bengali is bundled for Bangla.

## Try the keyboard flow

The first launch includes demo products and a sample draft bill. All receipts are explicitly marked as local demo receipts.

1. Press **F2**, enter `105`, and press **Enter**.
2. Enter `0.750` and press **Enter** to add 750 g of sugar.
3. Press numpad **+** to open payment.
4. Enter the amount received and press **Enter** to confirm.
5. The receipt is saved before success is displayed; press **Enter** again for the next sale.

| Key | Action |
| --- | --- |
| F2 | Focus product search |
| ↑ / ↓ | Move through products or focused bill |
| Enter | Select product, add quantity, or confirm the focused form |
| + | Open payment |
| Alt+B | Focus the bill |
| Enter in bill | Edit selected quantity |
| Delete in bill | Remove selected line, with temporary Undo |
| Esc | Close dialog or return to product search |
| Tab / Shift+Tab | Reach all other controls |
| ? outside an input | Open shortcut guide |

## Implemented

- Code/name search and category filtering; distinct numeric codes for variants.
- Fractional quantities to three decimals; pieces require whole numbers.
- Bill editing, removal/undo, fixed discounts, customer selection, cash/mobile/bank payment recording, change, and customer dues.
- Integer money and scaled quantities, with rounding at the line boundary.
- IndexedDB drafts and receipts; serialized writes and atomic sale/draft transition. A failed save leaves the draft intact.
- Local receipt history, stock reduced by recorded sales, customer balances, daily totals using Asia/Dhaka, receipt printing, JSON backup export, and sales CSV export.
- Production service worker caches the application and fonts for offline reopening. The cashier still records sales in IndexedDB.
- Responsive layouts for 1366×768, 1920×1080, and a stacked small-screen view.

## Verification

```sh
npm run build
npm test
```

Model tests cover weighted totals, quantity validation, cash change, customer dues, electronic overpayment rejection, stock movement, and invalid checkout. Browser verification covers keyboard product entry, fractional quantity entry, payment validation, discounts and customer balances, receipt persistence after reload, and both interface languages. The production app was reloaded and a sale completed with its preview server stopped, then reloaded again to verify the offline receipt persisted.

## Next phase

This is a local UI prototype. It has no authentication, Cloudflare D1 binding, server API, or cloud synchronization. Catalog and customers are demo data. Product editing, purchases, expenses, supplier accounts, returns/reversals, and customer collections are not implemented yet. Cash/mobile/bank buttons record a method; they do not process payments.

Connect the tested UI to an authenticated Worker API and D1. Add a durable outbox in the same IndexedDB transaction as each sale, a unique operation ID, and idempotent server commits for receipt, payment, and stock records. Surface pending/failed synchronization and keep historical price snapshots. Backend work should preserve the existing keyboard and focus behavior.

For a static Cloudflare preview, build first, then use the Wrangler CLI with `wrangler.jsonc`. Publishing and creating Cloudflare resources are separate from this local prototype. This configuration serves static assets; add Worker code and D1 bindings when implementing the backend.

Local data belongs to this browser and origin; export a backup before clearing browser storage. Different preview ports have separate demo workspaces. Settings shows when offline reopening is ready.
