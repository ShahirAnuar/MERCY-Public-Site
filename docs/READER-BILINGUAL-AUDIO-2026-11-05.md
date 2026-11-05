# The Guide bilingual and Quran audio update — 5 November 2026

Public reader implementation: commits 06cceca339962d924dfa22d120a57bc5ab002465 and 61411e06f8cf19d537d27128e6ff3942f33d7352.
Backend: Sites version 55, source 682aed3dfcba51621719bba55c3f8d6c25845be2, deployment succeeded.

- Malaysian readers retain English and Bahasa Melayu in one installed app. Selection updates story text, threads, six lenses and interface; it persists and preserves the current reader. Unknown PDF layouts use the complete Malay text view rather than painting text onto unverified pages.
- International readers use English/Malay for MY, BN and SG, and English/Arabic for other existing editions. Only EN/MS/AR translations currently exist. Further country-native translations remain future content work.
- YPKDT and ParentingU retain their edition language pairs. Existing family/account/access limits are unchanged.
- All 86 thread Quran references support Arabic recitation, including ranges, with Mishary Rashid Alafasy and Ahmad Al-Ajmi. Audio uses MP3Quran's official timing catalogue paired with its own recordings; playback requires internet.
- Play/pause/resume/stop and reciter selection are available. A thread's playback stops on context changes; background Surah continues while pages change. Starting verse playback stops other audio.
- Cache version 20 and the r2 audio asset query deliver the background-audio correction.

Verification: 76 related public-reader checks passed; backend language, route, translation, VIP/session and Quran-reference suites passed. Live browser checks confirmed Malay story/thread content; MY English/Malay and GB English/Arabic choices; Arabic RTL and reload persistence; actual playback from both reciters, pause, and verse-text reveal.

Publication recovery: the initial 61411e0 Pages deployment timed out in updating_pages. Retrying its deployment job returned the old cancelled state. This checkpoint starts a fresh publication from the same tested app code.
