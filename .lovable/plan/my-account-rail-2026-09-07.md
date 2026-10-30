# My Account rail

## What changes for you

1. In the top bar, the round profile picture comes first, with "My account" written after it.
2. Clicking it opens a panel that slides in from the left of the screen instead of jumping into the Brand Info tabs.
3. The panel shows what the old "Account info" tab showed: scripts available, reports available, account name, and password (hidden by default, with a show/hide eye).
4. "Log out" moves inside that panel, at the bottom — it no longer sits on its own in the header.
5. "Account info" disappears as a tab inside Brand Info, so Brand Info starts with Brand brief, then Visual style, then Connected socials.

## Technical notes

- New `src/components/slate/AccountRail.tsx`: fixed left drawer (backdrop + slide-in panel, Escape and backdrop close), props `open`, `onClose`, `clientName`, `accessCode`, `scriptsLeft`, `reportsLeft`, `avatarUrl`, `onLogout`. Content is the existing account-info markup moved out of `BriefMode.tsx` (credit cards with the red-under-10/green rule, account name, masked password with eye toggle), plus a Log out button at the bottom.
- `StatusStrip.tsx`: reorder avatar before the "My account" label; remove the standalone Log out button and its `onLogout` usage from the header.
- `SlateApp.tsx`: add `accountRailOpen` state; `onMyAccount` opens the rail instead of switching to `brief`/`account`. Render `<AccountRail>` with the existing `credits` values and `onLogout`. Drop the now-unused `briefTab`/`account` handling.
- `BriefMode.tsx`: remove the `"account"` entry from the sub-tab list and its render branch; narrow the `subTab`/`initialSubTab` union to `brief | visual | socials` and default to `brief`. Clean up icon imports that only the account panel used.
- Staff/admin behavior unchanged (no My account button for staff, so no rail either).
