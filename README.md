# Muhammed Fayaz — Data, with a human perspective.

A personal portfolio for a UAE-based data analyst and business intelligence professional. The design combines an immersive 3D opening, bold gradients and typography, and clean professional reading areas. A prominent portrait, selectable studies, and a working data explorer keep the content personal and useful. Built with HTML, CSS, vanilla JavaScript, and self-hosted Three.js, with no framework or build step.

## Run

```sh
python3 -m http.server 8000
```

Run the command from the folder containing `index.html`. Use a static HTTP(S) server: the Three.js ES-module imports do not initialize through `file://`. A local SVG poster still provides a static visual when scripts cannot run. Clipboard permissions and email-app handling depend on the browser; HTTPS or localhost is recommended.

## What to explore

- **Explore the sculpture:** a real WebGL ribbon morphs between Flow, Network, and Signal forms. Drag horizontally or use arrow keys to rotate it. The same mode controls work with touch, keyboard, and pointer input. Vertical touch gestures retain native page scrolling.
- **Natural color:** the About portrait switches between a muted treatment and its natural color. A smaller portrait also appears in the opening composition.
- **The work exhibit:** select a project through click, hover, touch, or arrow keys. On phones, the selected preview moves directly below its title. Each study opens in a native dialog with the question, approach, and outcome.
- **The sample data explorer:** work-arrangement controls and a metric selector update a chart, its headline figure, and its written observation. Selecting a bar inspects that month; selecting it again returns to the aggregate.
- **The toolkit:** accessible tabs connect capabilities, tools, and concrete outputs, without invented proficiency scores.
- **Write a note:** the contact invitation opens a native side-drawer dialog. Its form prepares an email draft; it does not deliver email through a server.

## Files

```text
index.html                       Semantic page, exhibits, and dialogs
styles.css                       Shared layouts, dialogs, forms, and accessibility
experience.css                   Combined 3D/neon/professional visual system
app.js                           Project/skill tabs, data explorer, navigation, contact
sculpture.js                     WebGL scene, morphs, controls, and Canvas fallback
vendor/                          Self-hosted Three.js 0.180.0 and MIT license
assets/data-sculpture.svg        Static poster for the sculpture
assets/muhammed-fayaz-portrait.png  AI-edited portrait based on the supplied suit photo
assets/projects.svg              Workforce concept illustration
assets/skin-analysis.svg         Machine-learning concept illustration
assets/smart-home.svg            Connected-home concept illustration
assets/Muhammed-Fayaz-CV.pdf      Supplied CV download
assets/fonts/                    Self-hosted Manrope font and its OFL license
```

Other original illustration assets remain available in `assets/`. The portrait is an AI-edited version of the supplied image, not an untouched original. Replace its source and descriptive alt text if you prefer a different photograph.

## Design and implementation

Manrope is self-hosted; its font and license come from `@fontsource-variable/manrope` version 5.2.8. The unified interface uses Manrope for both display and body text, with blue, cyan, and magenta accents. Three.js 0.180.0 is vendored locally with its MIT license. Runtime requests stay on the same origin: there are no external fonts, scripts, analytics, or cookies.

Mobile-first Grid and Flexbox layouts expand at 600, 760, 1000, and 1200 pixels. Project preview order adapts to the selected item on smaller screens. Forms use 16px input text, and primary interactive controls have at least 44px touch height. Text and image effects use CSS; state changes use the Web Animations API where available. Native page scrolling remains intact.

The sculpture uses 840 primary nodes, ribbon surfaces, wire connections, and light trails. Geometry morphs between the three forms, with approximately 30fps rendering and a device-pixel-ratio cap of 1.5 on narrow screens and 1.75 on larger screens. It pauses outside the viewport and when the tab is hidden. If WebGL2 is unavailable or its context is lost, a Canvas renderer retains the projected geometry and controls. The Motion control pauses decorative effects and saves only that preference in localStorage. System reduced-motion settings take priority and display a static sculpture; explicit mode and rotation controls remain usable. Native dialog focus containment, Escape dismissal, keyboard tabs, focus restoration, stable headings, explicit form labels, and live chart feedback support non-pointer use.

## Sample data and content

The explorer uses **illustrative data**, not private client data or verified research findings. The sample assumes 40 people and 20 workdays per month. For each month, workdays lost is `round(absence_rate × 40 × 20 / 100)`. The absence-rate headline is the six-month mean; the workdays headline is the six-month total. All chart values and observations come from those same arrays in `app.js`.

The biography, experience, academic studies, and impact figures are based on the supplied CV. Project screenshots are explicitly labeled as concept illustrations. The skin-classification academic result is not presented as clinically validated. The original downloadable CV includes the supplied personal/contact details.

## Contact behavior

The form validates input, percent-encodes a `mailto:` subject and body, and opens the visitor's email app. The visitor must send the draft there. The page retains the form values, explains the delivery step, and provides a fallback link. It never claims a message has been sent and does not save contact input.

For server-side delivery, connect a real form endpoint, keep credentials on the server, and show delivery success only after the endpoint accepts the message.

## Customize and deploy

Edit the page copy in `index.html`, project and skill content in `app.js`, scene behavior in `sculpture.js`, shared layouts in `styles.css`, and the combined visual treatment in `experience.css`. Upload the root HTML, CSS, and JavaScript files, including the companion modules described below, and the complete `assets/` and `vendor/` directories to a static host. No build command is required. Relative URLs support GitHub Pages subdirectory deployment.

Passed 30 hybrid Playwright checks in headless Chromium across 320, 390, 768, 1024, and 1440px viewports, exercising the interactions, sample calculations, keyboard focus, pause states, dialogs, email encoding, assets, no-JavaScript poster, real WebGL output, forced Canvas fallback, and touch gestures. A further 13 focused scene checks covered rendering and control behavior. Automated axe-core checks cover the page and open contact drawer. These checks do not establish complete accessibility or other-browser compatibility; manual keyboard, visual, and reduced-motion checks complement them.

## Animated avatar guide

`companion.js` and `companion.css` animate the eight-pose artwork in `assets/fayaz-avatar-poses.png`, prepared from the supplied avatar sheet. The face comes from that artwork; the former procedural 3D character has been removed. This is a 2D pose animation, not a rotating 3D reconstruction.

The guide waves on arrival and when Wave is pressed, animates the mouth only during actual speech playback, points left toward projects, and points down at contact. It remains in the viewport while visitors scroll. Voice is off by default and can be enabled or muted. Narration prefers an identifiable English male voice installed on the device (for example, Google UK English Male, Microsoft David, or Apple Daniel), with a slightly lower pitch and measured pace. Voice inventories may arrive asynchronously. Where a male voice is unavailable, the English device voice remains the fallback; browser speech does not guarantee the same speaker on every device. Mouth movement starts on the speech start event and stops on pause, end, error, mute, or hide. Word-boundary events drive open/closed mouth pulses when the browser provides them; otherwise a playback-gated cadence is used. Silent text introductions never animate the mouth. These image poses approximate speech timing and do not provide phoneme-level lip synchronization. Hide stops speech and pose timers; Show guide brings it back. Reduced-motion preferences and the site's Motion control stop pose cycling and decorative movement while retaining static section gestures. Background tabs suspend pose timers and cancel speech. If the pose sheet cannot load, the existing portrait is the fallback.

No new framework, package installation, WebGL context, or external runtime service is needed for the avatar. Include the companion JavaScript, CSS, and pose-sheet PNG when deploying. The image is a uniform four-column, two-row transparent sheet; CSS selects its cells without redrawing the face.
