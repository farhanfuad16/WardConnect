# WardConnect Mobile Interface Design

## Product direction
WardConnect is a calm, high-trust civic utility for one-handed use in a Bangladesh city-corporation ward. The primary design goal is to make routine reporting easy while making emergency actions unmistakable and low-friction. The app uses portrait orientation, large touch targets, clear status language, and a persistent bottom tab bar aligned with mainstream iOS conventions.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Splash | WardConnect mark, “Smart Citizen & Emergency Response,” then route to the signed-in experience or authentication. |
| Sign in | Email or phone, password, validation, sign-in action, registration entry point. |
| Create account | Name, email, phone, password, confirmation, ward selection, validation, account creation. |
| Home | Welcome header, selected ward, two prominent actions (Report an issue and SOS), active emergency banner, latest notices, notification badge. |
| Submit report | Category selection, description, optional landmark, photo picker with 1–3 previews, location capture state, submit confirmation with tracking ID. |
| SOS | Large emergency category choices, automatic current location, optional note, confirmation dialog, emergency submission result with 999 reminder. |
| My reports | Flat list of citizen reports with tracking ID, category, date, and status. |
| Report detail | Description, photos, location summary, current status, and chronological timeline. |
| Incident map | Verified public incidents, active hazard markers, resource markers, legend, and incident detail entry points. Unverified reports are never shown. |
| Incident detail | Published incident title, category, severity, location, description, photos, timeline, and “I can help” action. |
| Notices | Feed of emergency, utility, and general notices with unread emphasis and detail navigation. |
| Notice detail | Full notice message, category, timestamp, and ward context. |
| Notifications | Read/unread notification center, unread badge, mark-read and mark-all-read actions. |
| Resources | Searchable directory for ambulances, fire extinguishers, responders, boats, and generators. |
| Volunteer offer | Help type selection, additional note, submission confirmation, and incident context. |
| Profile | Name, email, phone, ward, notification settings, edit profile, and logout. |

## Key user flows

### Report a civic issue
1. User taps **Report an issue** on Home.
2. User selects a category and writes a concise description.
3. User optionally adds up to three photos and a landmark.
4. User grants location access; the app captures the current coordinates.
5. User reviews the location status and submits.
6. The app confirms success and displays the tracking ID.
7. The report appears in My reports with the submitted status.

### Send an SOS
1. User taps **SOS** from Home.
2. User chooses Fire, Flood, Medical, Accident, or Security.
3. The app captures the current location automatically.
4. User optionally adds a short note.
5. A confirmation dialog explains that the SOS will notify the ward system.
6. After confirmation, the app submits the emergency report and displays the 999 reminder.

### Follow a report
1. User opens My reports.
2. User taps a report row.
3. Report detail shows the current status, evidence, location, and timeline.
4. Timeline entries update as the ward admin acknowledges, progresses, resolves, or rejects the report.

### Discover a verified incident
1. User opens Map.
2. The app shows only verified public incidents plus hazard zones and resources.
3. User taps an incident marker or incident card.
4. Incident detail shows severity, status, timeline, and the **I can help** action.
5. User can submit a manual volunteer offer without automatic dispatch or matching.

### Read a ward notice
1. User opens Notices or taps the notification badge.
2. User selects a notice or notification.
3. The app opens the full message and marks the notification as read.
4. Read state is reflected in the notification center.

## Color choices

| Token | Color | Purpose |
|---|---|---|
| Deep teal | `#0F766E` | Primary brand and civic-action buttons. |
| Dark ink | `#102A2A` | High-contrast headings and body text. |
| Mist | `#F4F8F7` | App background and low-noise surfaces. |
| White | `#FFFFFF` | Cards, sheets, and primary content surfaces. |
| Coral red | `#D9485F` | SOS action, emergency labels, and destructive confirmation. |
| Amber | `#D97706` | Utility notices, caution states, and active hazard emphasis. |
| Leaf green | `#2F855A` | Resolved states and positive confirmations. |
| Slate | `#64748B` | Secondary text and metadata. |

The SOS control uses coral red with a clear label and icon rather than relying on color alone. Status pills always include text, and map markers are paired with a legend for accessibility. Cards use soft borders and modest radius values rather than heavy shadows, keeping the visual language close to a first-party iOS utility.
