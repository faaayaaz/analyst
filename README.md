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

Edit the page copy in `index.html`, project and skill content in `app.js`, scene behavior in `sculpture.js`, shared layouts in `styles.css`, and the combined visual treatment in `experience.css`. Upload those five files and the complete `assets/` and `vendor/` directories to a static host. No build command is required. Relative URLs support GitHub Pages subdirectory deployment.

Passed 30 hybrid Playwright checks in headless Chromium across 320, 390, 768, 1024, and 1440px viewports, exercising the interactions, sample calculations, keyboard focus, pause states, dialogs, email encoding, assets, no-JavaScript poster, real WebGL output, forced Canvas fallback, and touch gestures. A further 13 focused scene checks covered rendering and control behavior. Automated axe-core checks cover the page and open contact drawer. These checks do not establish complete accessibility or other-browser compatibility; manual keyboard, visual, and reduced-motion checks complement them.

## Animated portfolio guide

`companion.js` and `companion.css` add a self-contained, procedural Three.js character inspired by the supplied suit-and-tie reference. It is a simplified model, not a rigged reconstruction of the supplied portrait. Include both files when deploying the site.

The guide waves on arrival, stays in the viewport as the visitor scrolls, introduces the current section, and gestures toward the work section and selected projects. Wave replays the greeting. Voice is off by default; visitors can opt in to browser speech synthesis and mute it again. Voice availability and audible playback depend on the browser and installed voices. Speech uses the browser's configured synthesis service. Hide removes the guide and exposes a Show guide button. Reduced-motion preferences and the site's Motion control stop character animation. Hidden tabs stop rendering and speech. Where WebGL is unavailable, a portrait and the same text controls remain available.

Onboarding validation after this addition covered actual WebGL initialization, section updates, wave, hide/show, reduced motion, mobile overflow, and the existing chart, tabs, study dialog, and sculpture controls. Voice opt-in and mute were checked with a mocked speech API; audible output needs a manual browser check.
