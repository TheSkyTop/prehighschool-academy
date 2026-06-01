# PreHighSchool Academy Mobile Beta Test Plan

## Release Target

Commercial pilot scope: first 2 weeks, 14 daily missions, 7 subjects, learn > demo > quiz flow, reward points, mistake bank, and knowledge map.

## Content Quality Gate

Run before every beta build:

```bash
npm run release:check
```

Expected pilot rules:

- 14 quests across Week 1 and Week 2.
- 7 subjects per week in this order: Maths, Reading, English, Writing, Science, Physics, Reasoning.
- Each quest has one focused lesson, visual demo, verified video support, exam strategy, quick check, and mistake tags.
- Non-writing subjects use 10 quiz tasks.
- Writing uses 1 writing task worth 10 quiz credits, with word count feedback and a 100-200 word target.
- Reading uses 2 passages with 5 questions each.

## Web PWA Test

Test on desktop Chrome first:

1. Open `http://127.0.0.1:5173/`.
2. Confirm Dashboard, Knowledge Map, Mistake Bank, and Rewards navigation.
3. Complete one Maths quiz with one wrong answer.
4. Confirm result accuracy, answer explanations, points, and mistake bank entry.
5. Delete the mistake bank item and confirm it disappears.
6. Reload the page and confirm progress persists.

## Android Tablet / Phone PWA Test

Use Chrome on Android:

1. Open the hosted beta URL.
2. Use Chrome menu > Add to Home screen.
3. Launch from home screen and confirm standalone app display.
4. Test portrait and landscape.
5. Complete Maths, Reading, Writing, and Rewards flows.
6. Confirm YouTube embeds load inside the Demo tab.
7. Turn network off after first load and confirm the app shell still opens.

## iPad PWA Test

Use Safari on iPad:

1. Open the hosted beta URL.
2. Share > Add to Home Screen.
3. Launch from the home screen.
4. Test landscape first, then portrait.
5. Confirm tab bars, quiz answers, text areas, and reward panel fit without horizontal scroll.
6. Complete one Writing task and confirm word count feedback.
7. Confirm browser back returns to Dashboard from a lesson page.

## Android Native Wrapper Path

For a later APK/AAB beta, wrap the PWA with Capacitor:

1. Add Capacitor dependencies and Android platform.
2. Configure app id, app name, splash screen, and icons.
3. Use `npm run build`, then sync web assets into Android.
4. Test with Android Studio emulator and one real Android tablet.

Do this after the two-week PWA pilot is approved, because the current app is already testable as an installable PWA.

## Beta Acceptance Checklist

- No blank pages after refresh or back navigation.
- No missing lessons, demos, videos, or quiz explanations.
- No duplicate topics in the knowledge tree.
- Mistake Bank can filter by subject and delete individual items.
- Rewards use cumulative points and weekly badge language.
- Dashboard shows only Streak, This Week, and Points.
- App remains usable on 10-inch tablet, iPad landscape, and phone portrait.
- Local storage failure does not crash the app.
- Privacy and child-safety notes are reviewed before any public release.

## Not Yet Public-Store Ready

The beta can be tested as an installable PWA. Before Google Play, TestFlight, or App Store distribution, complete the items in `PRIVACY_AND_SAFETY.md`, especially formal privacy policy, parent consent, and data controls if cloud sync is added.
