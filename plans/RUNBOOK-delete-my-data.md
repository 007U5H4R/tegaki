# Runbook — "Please delete my data"

Someone has emailed asking to be forgotten. This is how it is honoured, what
each option costs them, and what to do when a step fails.

Nothing here is automated on the customer's behalf. There is no self-serve
delete button, deliberately: a paid order is also the record of a
transaction, and a button that removes it is a button that removes the
evidence of a dispute. A person asks, a person acts.

---

## 1. Establish who is asking

Reply from the Tegaki address and confirm the request came from the **email on
the account**, not merely an address that knows the customer's name. If the
two differ, ask them to send the request from the account address. An erasure
performed for the wrong person is not recoverable.

Ask which of the two they want — quote them verbatim:

> **Delete my data, keep the record.** Your handwriting samples, your report
> and every personal detail we hold (name, email, phone, city, age) are
> destroyed. What remains is an order with dates, a tier and a payment, and
> nothing that identifies you. We keep it so our accounts balance and so we
> can answer a later question about the payment honestly.
>
> **Delete everything.** The order goes too, along with its payment record.
> Nothing survives. If you later ask us whether you were charged, or for a
> copy of your report, we will not be able to answer — we will have nothing
> to look at.

Most people mean the first. Ask; do not assume.

---

## 2. One order

`/admin/orders/<id>` → **If they ask to be forgotten** → *Erase this order's
data*. Choose the mode they picked, type the eight-character order id, confirm.

The dialog names exactly what goes. Read it before clicking; it is the last
screen between the request and an irreversible delete.

**A note on their report.** If they asked for erasure but might still want
their report, send them the PDF *before* running this. Afterwards it is gone
from storage and cannot be regenerated — the samples it was written from are
destroyed in the same action.

---

## 3. Every order for one person

There is no bulk button, on purpose: an account-wide erasure is rare enough
that a wrong click should not be able to do it.

1. `/admin` → find every order for that email. Note the ids.
2. Run step 2 for each, oldest first.
3. Once no orders remain, delete the account itself in the Supabase dashboard
   (**Authentication → Users → … → Delete user**). The profile row and
   anything still keyed to the account cascade with it — this is asserted by
   `tests/rls/account-deletion.test.ts`, which exists because it once did not
   work: `order_files.uploader_id` had no `on delete` rule, so any account
   that had uploaded a sample was undeletable and the API answered with a
   bare 500.

Deleting the account **before** the orders leaves the orders behind with a
dangling buyer. Do the orders first.

---

## 4. When storage refuses

The action deletes the database rows first and the objects second, and it
reports what it could not remove:

> The records were deleted, but 1 file(s) could not be removed from storage…

This is the one ordering in the system that leaves a mess rather than a
retry, and it is deliberate: the rows are what expose a customer's data
through the app, so they go first. What is left is an orphaned object in a
private bucket that nothing points at and no scheduled job will ever find.

Clear it by hand: **Supabase dashboard → Storage → `samples` (or `reports`) →
the `<buyer-uid>/<order-id>/` folder → delete**. The error message names the
path. Do it the same day — it is the only record that the file still exists.

---

## 5. Confirm and close

Reply to the customer stating what was deleted and what, if anything, was
kept and why. If they chose "keep the record", say plainly that an anonymous
order and payment row remains, so they are not surprised to hear later that
we can confirm a transaction.

---

## Related: the automatic 90-day deletion

Separate mechanism, same machinery. Samples are destroyed 90 days after the
report is marked **delivered** — not after it is completed. The nightly job at
`/api/cron/retention` does it and logs `[retention]` with counts on every run.

Two things worth knowing:

- **An order completed but never marked delivered has no retention clock**,
  so its samples are kept indefinitely. This is deliberate — holding a file
  too long is recoverable, deleting one early is not — but the job counts
  them as `undeliveredBacklog` and warns when the number is above zero. If it
  climbs, orders are being finished without *Mark as delivered* being pressed.
- **Reports are never touched** by retention. Customers keep them.

Check a run: Vercel → the project → **Logs**, filter `[retention]`. A day with
no such line means the cron did not fire, which is the failure worth noticing
— a retention job that silently stops reports nothing at all.
