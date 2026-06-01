# Privacy And Child Safety Notes

PreHighSchool Academy is currently a local-device beta for Years 4-6 exam readiness.

## Data Stored In The Beta

The app stores progress on the device using browser local storage:

- Points
- Weekly completion
- Quiz attempts
- Mistake Bank entries
- Parent reward rules

The beta does not create accounts, upload student work, or send progress to a server.

## Writing And Media Safety

Writing prompts may encourage children to imagine adding a photo or short video to make writing more engaging. Public sharing should always require parent approval.

Student writing should not include:

- Full name
- Address
- School timetable
- Phone number
- Private family details
- Identifiable images without parent permission

## Rewards

Rewards are parent-approved virtual rewards. The current default is 700 points for an AU$5 Roblox gift card or equivalent cash reward.

Commercial release should include:

- Parent-controlled reward settings
- Clear statement that rewards are optional
- No automatic payment or redemption inside the child app
- Parent confirmation before any real-world reward is given

## YouTube Videos

The app uses curated YouTube embeds for learning support. Before public release:

- Re-check that all videos are still available and embeddable.
- Prefer channels with child-safe educational tone.
- Avoid videos with distracting thumbnails or unsuitable comments if opened externally.
- Consider a server-side video allowlist for production.

## Commercial Release Requirements

Before a hosted or app-store release, add:

- Formal privacy policy
- Terms of use
- Parent/guardian consent flow if accounts or cloud sync are added
- Data deletion/export controls if server storage is introduced
- Content moderation rules for any social sharing feature

The current beta is appropriate for local PWA testing, not yet for public app-store distribution.
