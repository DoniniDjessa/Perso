# Feature Specification: Life Memory Core

**Feature Branch**: `001-life-memory-core`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Treat flow.md into a V1 personal life-memory mobile app: capture everything that matters as timestamped events, keep pointers to unsavable media, retrieve a day / expenses / people in natural language, without building the full discipline OS yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture a trace in seconds (Priority: P1)

The owner opens the app, taps a persistent capture control, and records what just happened: a note, an expense, a person met, a place, a photo reference, a document, or a commitment. The save produces one Event on the universal timeline. Optional fields (category, linked person, linked place) can wait.

**Why this priority**: If capture is heavy, the product has no memory. This is the only story that fills the ledger.

**Independent Test**: From a cold open, save a note and an expense in two separate captures, then find both on Today and on the day timeline.

**Acceptance Scenarios**:

1. **Given** the owner is on any main screen, **When** they tap Capture and save a one-line note, **Then** an Event exists with timestamp, type note, source manual, confidence certain.
2. **Given** the owner is capturing an expense, **When** they enter amount + short label and save, **Then** the Event appears on Today under money and on the timeline at that time.
3. **Given** the owner is mid-capture, **When** they leave the screen without saving, **Then** nothing is written as a fact (a local draft MAY be offered, but it is not a confirmed Event).
4. **Given** the network is unavailable, **When** they save a capture, **Then** the Event is stored on the device and marked pending sync.

---

### User Story 2 - See Today at a glance (Priority: P1)

The home screen is Today. It reconstructs the current day: time-ordered events, money in/out, people met, meals if logged, open commitments, and a single prompt "What did you do today?" answered from data, not from a motivational sentence.

**Why this priority**: The owner must feel the memory working on day one, without hunting menus.

**Independent Test**: After logging a mixed morning (wake note, breakfast, expense, person), open the app on the home screen and verify each block reflects those traces.

**Acceptance Scenarios**:

1. **Given** Events exist for today, **When** the owner opens the app, **Then** Today lists them in chronological order and shows totals that match those Events.
2. **Given** no Events exist for today, **When** the owner opens the app, **Then** Today is empty-but-honest (zeroes / "nothing captured") and Capture is the primary action.
3. **Given** an inferred item exists (if any), **When** Today is shown, **Then** it is visually distinct from confirmed facts.

---

### User Story 3 - Replay any day (Priority: P1)

The owner picks a date (or asks for "Tuesday 10") and gets a chronological replay: events, places, people, amounts, media pointers, notes, documents, and tasks for that day. They can open any Event to see relations and proofs.

**Why this priority**: Reconstruction of a day is the product's core promise.

**Independent Test**: Seed a past day with at least five Event types, open that date, and walk the replay from first to last Event.

**Acceptance Scenarios**:

1. **Given** Events exist on 10 May, **When** the owner opens that date, **Then** they see a time-ordered replay covering those Events and nothing from other days.
2. **Given** an Event has linked people, place, expense, or media pointer, **When** the owner opens the Event, **Then** those relations are visible and tappable.
3. **Given** a media pointer's file is unreachable, **When** the owner opens it, **Then** they see the metadata plus an honest "file not reachable" state, not a fake preview.

---

### User Story 4 - Ask my life a question (Priority: P1)

The owner types or dictates a question such as "What did I do last Tuesday?", "How much did I spend Tuesday?", "Who did I see Tuesday?", "Show photos from Tuesday", or "Where was I?". The app answers from Events, with citations to the underlying traces.

**Why this priority**: Retrieval is the reason to capture. Menus must not be the only way in.

**Independent Test**: After seeding a known Tuesday, ask the four questions above and verify answers match the seeded Events.

**Acceptance Scenarios**:

1. **Given** Events on a known Tuesday, **When** the owner asks what they did that day, **Then** the answer is a chronological recap of those Events.
2. **Given** expenses on that Tuesday, **When** they ask how much they spent, **Then** the answer is the sum of those expense Events, with the list available.
3. **Given** people linked to Events that day, **When** they ask who they saw, **Then** the answer lists those people and last-interaction times.
4. **Given** the question cannot be answered from stored facts, **When** they ask, **Then** the app says it does not know and does not invent events.

---

### User Story 5 - Keep people as living files (Priority: P2)

Each person the owner logs becomes a file: first seen, last seen, interaction count, related subjects, money exchanged if logged, and open commitments involving them.

**Why this priority**: Relationship memory is a main query target ("who did I see Tuesday?") but depends on Events already existing.

**Independent Test**: Log two meetings with the same person on different days, open the person file, and verify last interaction, count, and both Events.

**Acceptance Scenarios**:

1. **Given** a new name on a capture, **When** the owner saves, **Then** a Person file is created or matched and linked to the Event.
2. **Given** a Person with past Events, **When** the owner opens the file, **Then** they see last interaction, first interaction, count, and recent Events.
3. **Given** a commitment involving that person is overdue, **When** the owner opens the file, **Then** the overdue commitment is visible.

---

### User Story 6 - Remember money without bookkeeping theatre (Priority: P2)

The owner logs a spend or income with amount, optional category, optional payment means, optional linked person/place/project. Later they can list expenses for a day, a category, or a period via Ask or the day replay.

**Why this priority**: Expense history is an explicit user request; full banking automation is V4.

**Independent Test**: Log three expenses on one day, ask for that day's spend, and verify the total and the largest item.

**Acceptance Scenarios**:

1. **Given** the owner enters 15 000 and "fuel", **When** they save, **Then** an expense Event exists with amount 15000, label fuel, timestamp now.
2. **Given** several expenses on a day, **When** they ask for that day's spend, **Then** they get the correct sum and can open each Event.
3. **Given** an expense is linked to a person or place, **When** they open that person or place, **Then** the expense appears in the related list.

---

### User Story 7 - Point at unsavable media and documents (Priority: P2)

The owner attaches a reference to a photo, video, or document that lives outside the app (Drive, iCloud, local files). The Event stores date, context, optional people/place, and the pointer. Documents may carry extracted fields later; V1 at least stores the file reference, a title, and dates (including expiry if entered).

**Why this priority**: The original brief insists some things cannot be stored inside the app, but must remain findable.

**Independent Test**: Save a photo pointer and a document pointer on a day, then retrieve both via that day's replay and via Ask.

**Acceptance Scenarios**:

1. **Given** the owner picks or pastes an external file reference, **When** they save, **Then** a media or document Event exists with pointer, timestamp, and optional context — not a full copy of the heavy file.
2. **Given** a document has an expiry date, **When** that date is within 30 days, **Then** Today and Ask can surface it as an upcoming expiry.
3. **Given** the owner asks for photos from a date, **When** media Events exist that day, **Then** the answer lists those pointers.

---

### User Story 8 - Do not drop spoken commitments (Priority: P2)

When the owner logs "I will call Paul tomorrow" or a due task, the app creates a commitment Event with a person (optional), due date, and status. Overdue items appear on Today. Completing it closes the loop on the timeline.

**Why this priority**: Discipline starts with remembering one's own word; scoring and coaching wait for V3.

**Independent Test**: Create a commitment due today, leave it open, confirm it appears on Today; mark it done; confirm it no longer appears as open.

**Acceptance Scenarios**:

1. **Given** the owner captures a commitment with a due date, **When** they save, **Then** a commitment Event exists as open.
2. **Given** an open commitment is due today or overdue, **When** they open Today, **Then** it is listed as pending.
3. **Given** they mark it done, **When** they view Today and the person file, **Then** it is completed, not deleted from history.

---

### Edge Cases

- Two people with the same display name: the owner MUST be able to distinguish and pick the correct file.
- Zero-amount or missing-amount expense: the capture MUST NOT become a fake 0 fact; amount is required for expense type.
- Future-dated Events: allowed for planned commitments; Today MUST not treat them as "already happened".
- Timezone / travel: Events MUST keep the instant they were saved; day grouping uses the owner's local calendar day unless they later change a timestamp.
- Duplicate rapid taps on save: only one Event is created.
- Empty Ask query: the app does not invent a day recap; it asks for a question.
- Ambiguous date in a question ("Tuesday"): resolve to the most recent past Tuesday and say which date was used.
- Pointer with invalid URL/path: keep the Event; mark the pointer unresolved.
- Very long note: stored in full; Today shows a truncated preview.
- Owner edits a past Event: history remains an Event; the original timestamp can be corrected; source stays manual unless later automation exists.
- Owner deletes an Event: it leaves the timeline; related person/place files remain if they have other Events.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST represent every capture as an Event with type, start time, optional end time, description/label, source, confidence, and optional location text.
- **FR-002**: The system MUST support Event types at least: note, expense, income, person-meeting, place-visit, media-pointer, document, commitment/task, meal.
- **FR-003**: The system MUST allow linking an Event to people, places, media pointers, documents, and amounts without requiring all links on first save.
- **FR-004**: Users MUST be able to complete a basic capture (type + one required field + save) in under 5 seconds of attention once the keyboard is open.
- **FR-005**: The system MUST persist Events on device before depending on a network.
- **FR-006**: The home surface MUST be Today: chronological Events, money total, people count, open commitments, and a data-backed "what did you do today?" recap.
- **FR-007**: Users MUST be able to open any calendar day and see only that day's Events in time order (day replay).
- **FR-008**: Users MUST be able to ask natural-language questions about a date, spend, people, places, media, documents, and open commitments.
- **FR-009**: Answers to questions MUST be grounded in stored Events. If evidence is missing, the system MUST say it does not know.
- **FR-010**: Every Event MUST display its source and whether it is certain or inferred.
- **FR-011**: The system MUST maintain Person files derived from Events (first/last interaction, count, related Events, related money, related commitments).
- **FR-012**: Expense/income Events MUST store amount and currency as captured.
- **FR-013**: Media MUST be stored as pointers plus metadata (timestamp, optional place/people/context), not as the canonical HD original.
- **FR-014**: Document Events MUST store a title, pointer, optional expiry, and optional related person/asset.
- **FR-015**: Commitment Events MUST store a due date, status (open/done/cancelled), and optional person.
- **FR-016**: Users MUST be able to open an Event and see its relations and any attached proofs (pointer, note, amount).
- **FR-017**: Navigation MUST stay shallow: Today, Timeline/Replay, Capture, Ask, and a library for People / Money / Documents / Media. No requirement for 50 menus.
- **FR-018**: The system MUST NOT generate motivational coaching, life scores, or habit lectures in this feature.
- **FR-019**: The system MUST treat data as belonging to a single owner and MUST NOT include sharing or public publishing.
- **FR-020**: Upcoming document expiries (owner-entered) MUST be retrievable via Today and Ask within a 30-day window.

### Key Entities

- **Event**: The atomic, timestamped fact. Has type, times, label, source, confidence, optional location text.
- **Person**: A durable file for someone the owner meets or mentions. Linked through Events.
- **Place**: A named location referenced by Events (text in V1; map pin later).
- **Money movement**: Amount + currency attached to an Event (expense or income).
- **Media pointer**: Reference to an external photo/video/file, with metadata.
- **Document**: Titled pointer with optional expiry and related person/asset.
- **Commitment**: A promised action with due date and status, itself an Event.
- **Note**: Free text attached to or constituting an Event.
- **Day**: A calendar grouping of Events used by Today and Replay (not a separate silo of data).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new owner can save their first Event in under 30 seconds from first open of Capture.
- **SC-002**: After 10 mixed Events on one day, Today and Replay show all 10 in the correct order, with money totals matching the expense Events.
- **SC-003**: For a seeded Tuesday, the four questions (what I did / how much I spent / who I saw / which media) return complete, citation-backed answers on the first attempt.
- **SC-004**: When no data exists for a question, 100% of answers refuse to invent Events.
- **SC-005**: Capture of a note or expense still succeeds with the network turned off.
- **SC-006**: Opening a person who appears on 3 Events shows count 3 and the latest Event's time.
- **SC-007**: An owner who only uses Capture + Today + Ask for a week can retrieve "what I did on [a past day]" without using any other screen.

## Assumptions

- The owner is a single person using the app for themselves (not a family account, not a team CRM).
- V1 capture is mostly manual / micro-saisie. Background location, bank feeds, camera-roll ingest, and Drive crawling are out of scope (V4).
- Natural-language Ask in V1 can be implemented as structured retrieval over Events (date, type, person, amount) plus a thin language layer; it does not require a full independent "digital twin".
- Meal logging is an Event type in the model so food is not a dead-end, but a dedicated nutrition coach is out of scope.
- Assets, businesses, decisions, Miroir, Life Score, and Future-self coaching are out of scope for this feature (V2–V3).
- Places are names (and optional address text) in V1; Google Maps is later.
- Proofs in V1 are the original Event fields plus pointers, not a separate evidence courtroom UI.
- UI language can be French-first; questions may be asked in French or English.
- Amounts are commonly FCFA but any currency code the owner types/selects is stored as-is.
- Authentication is "this device / this owner" — no social login requirement in the spec.
- `flow.md` remains the vision bible; this spec is the executable V1 slice of it.
