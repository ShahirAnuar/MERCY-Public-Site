# Shahir VI · Pharmacy Store prototype

Asset-light cache-first web unit for the planned `/wpd2026/store/` deployment.

## Included

- Central VI Awwab guide stage that remains visually present on desktop and mobile.
- Reuses the project’s approved `awwab-poster.svg` artwork and the documented `awwab-idle.mp4` integration slot.
- Four Store Management stations: receiving, safe storage, inventory control, and issue/trace.
- Local JSON knowledge with a built-in fallback, no remote AI or patient-specific inference.
- Safe redirect for diagnosis, medicine, dose, interaction, or personal medication questions.
- Speech/TTS adapter using the browser voice layer; idle/talking state hooks are ready for real VI Awwab media.
- Service worker precache plus runtime media caching; no large media is bundled.

## Local test

Serve this folder over HTTP (service workers do not run from `file://`), then open `index.html` through the local server. Expected path mapping for deployment is `/wpd2026/store/`.

## Media integration point

When approved VI Awwab idle/talking video or WAV assets are located, place them under `assets/video/` or `assets/audio/` and update the existing media adapter in `app.js`; the approved poster remains the lightweight fallback. Do not preload large video files in the initial package.
