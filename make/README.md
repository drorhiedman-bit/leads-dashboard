# Email to lead (Make.com)

This automation adds leads to the dashboard from email. It is not part of
the published site: the Publish workflow copies only the site files.

## How it works

Every 4 hours the Make scenario does this:

1. **Gmail, Watch emails**: picks up new emails that have the label `Leads`.
   Put the label on a customer email by hand, or with a Gmail filter.
2. **Make AI, Extract information**: reads the email and returns:
   - is it a lead?
   - name, phone, town
   - job type (one of the 6 dashboard job types)
   - urgency 1-5 and distance in km from Moshav HaYogev
   - a one-line Hebrew summary
   - "needs review" when something was guessed
3. **Filter "Is a lead"**: stops ads and newsletters.
4. **Airtable API call**: looks for a record with the same Gmail ID.
   This makes the run idempotent: running it twice never creates two
   leads from one email.
5. **Filter "Not added yet"**: continues only when no record was found.
6. **Airtable API call**: reads the highest Lead ID, so the new lead gets
   the next number and Lead ID stays unique.
7. **Airtable, Create a record**: writes the lead with:
   - Source = `Email`, Stage = `New`, Received minutes ago = `0`
   - Value from the typical price of the job type
   - the raw email, the AI summary, Gmail ID, Received at and Needs review

The dashboard accepts `Email` as a source (see SPEC.md).
It scores 9 points, like Google, because it is a direct inquiry.

## Cost on the Make Free plan

| What | Credits |
|---|---|
| Each check of the mailbox, even when there is no new email | 1 |
| Each new lead (AI, 2 lookups, create) | about 4 more |
| 6 checks a day | about 180 a month, plus 4 to 5 per lead |

## Import

1. In Make: Create a new scenario › `...` › Import Blueprint ›
   `email-to-lead.blueprint.json`.
2. Reconnect Gmail, Airtable and Make's AI Provider.
3. Replace `<AIRTABLE_BASE_ID>` and `<LEADS_TABLE_ID>`.
4. Set the schedule to every 4 hours.

No tokens or email addresses are stored here.
