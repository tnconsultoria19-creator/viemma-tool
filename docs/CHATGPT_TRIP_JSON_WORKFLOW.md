# Viemma Tours — ChatGPT consultation to itinerary import

## Purpose

Use one structured JSON record as the hand-off between a recorded client/agent conversation and the Viemma workspace. The same importer is available above each owner workspace tab; it is not a separate import system for each screen.

## Which tab and import scope to use

- **Clients:** paste the full consultation output. Select **Full consultation (all sections)** and keep **Merge supplied fields (recommended)** selected. This can update client details, travellers, flights, transfers, hotels, programme/day titles, finance and welcome placard settings in one pass.
- **Flights:** paste only flight-related JSON. The importer should default to Flights; choose that scope explicitly if needed.
- **Transfers:** paste collection/drop-off, timing, flight-link, vehicle or meet-and-greet information.
- **Hotels:** paste hotel bookings, dates, room types, meal basis, booking status and traveller/room links.
- **Programme:** paste the day-by-day schedule and activity details.
- **Timeline:** paste daily titles and schedule changes. Programme and Timeline both understand day titles and activity schedule data.
- **Finance:** paste confirmed quote/costing details only. Check every figure before quoting or publishing.
- The importer also supports focused updates for drivers and vehicles from their relevant workspace modules.

Use **Replace records in this section** only when the JSON contains the full intended list for that section. Replace can remove existing records not included in the supplied list. Prefer Merge for normal updates.

## Conversation workflow

Record the conversation, transcribe it, and ask ChatGPT to turn the transcript into one JSON object following the example schema. Keep the stages below in the conversation where practical:

1. **Who is travelling?** Get the lead contact's full name, preferred name, mobile/WhatsApp, email, country of residence, nationality if supplied, party size, each traveller's name/age category, relationships and who is the lead contact.
2. **Dates and purpose.** Confirm arrival/departure dates, trip length, destination(s), reason for travel, flexibility and the kind of trip: half-day tour, full-day tour, day tour, multi-day tour/package, multi-day safari, private guided day tour, scheduled/shared departure, self-drive tour, tailor-made package or transfer.
3. **Flights.** Capture airline, flight number, date, origin, destination, departure/arrival times, cabin, booking reference and the travellers on each flight. Separate inbound, outbound and domestic/regional flights.
4. **Transfers and meet-and-greet.** Confirm collection date/time, airport or other pickup point, drop-off address/property, flight number, passenger/luggage count, vehicle requirements, child seats, mobility needs, driver/vehicle if confirmed, and exact wording for the welcome sign. Distinguish pickup time from flight arrival time.
5. **Hotels and rooms.** Confirm property name, check-in/check-out dates, room count/type, bed setup, meal basis (for example room only, B&B, dinner, bed and breakfast), guest allocation, booking/reference number, status, payment/deposit details and special requests.
6. **Programme.** Work through every day in order. For each activity capture day number/title, date, name, area/venue, pickup point and time, start and finish time, duration, inclusions, supplier/booking reference, group or traveller allocation, status, practical notes and weather/accessibility dependencies. Mark free time explicitly rather than inventing an activity.
7. **Requirements.** Confirm dietary needs/allergies, accessibility/mobility, medical details necessary for safe operations, language, pace, interests, room preferences, transport preferences and any other agreed requirements. Keep sensitive details out of public-facing copy unless genuinely required.
8. **Price and terms.** Capture currency, quoted prices, supplier costs, markup/commission, discounts, contingency, deposit, balance due and payment terms only when actually provided. Distinguish estimates, requested services, held services and confirmed bookings.
9. **Read back the gaps.** Before generating final JSON, list missing or ambiguous essentials for follow-up. Do not invent an airline, flight time, hotel, booking reference, price, driver, vehicle or confirmation status.

A focused conversation is fine. For example, after the general consultation, a separate conversation about a changed return flight can produce a JSON object with only a `flights` array. Import it on Flights using Merge; other tabs should stay unchanged.

## Required response behaviour for ChatGPT

When asked to prepare an import:
- Return a **single valid JSON object only**. No Markdown fences, explanation or comments before/after the object.
- Use `"schemaVersion": "viemma-trip-v1"`.
- Use ISO dates (`YYYY-MM-DD`) and 24-hour local times (`HH:mm`) where known.
- Omit unknown fields or set them to `null`; never create factual values to fill a blank. In merge mode, omitted/null values do not overwrite an existing value.
- Preserve the distinction between **Planned**, **Requested**, **Pending**, **Held** and **Confirmed**. Do not mark a service confirmed unless the conversation states it is confirmed.
- Use `"isProvisional": true` for unnamed or not-yet-identified travellers. Do not substitute labels such as "Adult 1" for a confirmed passport name.
- Reuse traveller names consistently across flights, transfers, hotels and programme activities. Name matching is how the importer links travellers to services if their numeric record IDs are not known.
- Keep internal supplier costs/commission in the finance fields and operational notes. Do not write those into client-facing activity descriptions.
- Do not include passport or medical data that was not provided. Keep such fields null/omitted if unknown.

## Canonical JSON shape

The importer accepts common key aliases, but these are the recommended stable top-level keys:

- `schemaVersion`
- `tripTitle`, `source`, `agent`
- `client`, `travellers`, `dietaryRequirements`, `accessibilityRequirements`, `preferences`
- `flights`, `transfers`, `hotels`
- `itinerary` (an array of day objects, each with `day`, `title`, and `activities`) and/or `dayTitles`
- `finance`, `welcomePlacard`, `internalNotes`

Refer to [the example JSON file](./examples/viemma-trip-json.example.json). Treat it as a structural example only; its dates and sample names are not real booking details.

## After import

1. Read the success or warning message in the importer.
2. Open the affected tab and inspect each field, day and passenger assignment.
3. Follow up on anything marked provisional, requested, pending or missing.
4. Check duplicate flights/services and ensure the correct travellers are linked.
5. Reconcile costs and booking references against source documents.
6. Save/sync the trip. Re-check the client view and PDFs before publishing or sending anything.

The importer is a mapping and data-entry aid, not a booking engine or a substitute for checking the source conversation and supplier confirmations.
