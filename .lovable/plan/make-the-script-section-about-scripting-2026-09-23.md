# Make the Script section about scripting

## What changed already

- The status cell in the content tables is now a single dropdown instead of a row of buttons, so every row is one line tall again.
- A new "To Film" tab sits between "In Progress" and "To Approve", with its own amber dot. Clients can move a post to To Film from the status dropdown and pick it when creating a post.

## The problem with the Script page today

The page opens with two big blocks of reading: the strategy on the left and the audit findings on the right, then the format split, and only after all of that does the actual scripting start. It reads like a report, not like a place to write scripts.

## Proposed new plan: a thin context bar, with the reading behind it

Replace the two tall text columns with one slim bar at the top of the Script page:

```text
+---------------------------------------------------------------+
|  Your strategy: 3 BROLL, 4 Talking, 2 Graphics this month      |
|  [ Strategy ]  [ Audit findings ]              (both open      |
|                                                 as panels)    |
+---------------------------------------------------------------+
|  WRITE SCRIPTS                                                |
|  Still missing this month:  BROLL 3  Talking 4  Graphic 2      |
|  (the format buttons stay exactly as they are)                 |
+---------------------------------------------------------------+
```

Concretely:

1. The strategy text and the audit findings are no longer printed on the page. Each becomes a small pill button: "Strategy" and "Audit findings", with a one line preview next to them (for example the recommended focus in a single sentence, and the number of findings). Clicking either opens the same full panel that exists today, with the same editing.
2. Above those pills, one short line of plain context so the page still tells the client where they stand, without a wall of text.
3. The scripting area becomes the visible hero of the page: a clear "Write scripts" heading, the short "still missing this month" line, and the format buttons right under it, so the first thing on screen is the action, not the reading.
4. Nothing is lost: full strategy text, editing, monthly split, and all audit findings stay reachable in their panels.

## Alternative, if you want to keep more on screen

Keep a single collapsible strip titled "Your plan this month" that is closed by default and remembers the client's choice. Open it and it shows strategy on the left and audit on the right exactly as today. Closed, the page starts at scripting.

## Notes

Only the Script page presentation changes. The strategy text, audit data, monthly targets, and the scripting flow itself are untouched.
