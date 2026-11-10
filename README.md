# Muhammed Fayaz — A human eye. A data mind.

A personal portfolio for a UAE-based data analyst and business intelligence professional. The design takes the form of an editorial exhibit: expressive typography, a prominent portrait, selectable studies, and small working experiments. Built with HTML, CSS, and vanilla JavaScript, with no framework or build step.

## Run

```sh
python3 -m http.server 8000
```

Run the command from the folder containing `index.html`. You can use any static HTTP server or open `index.html` directly. Clipboard permissions and email-app handling depend on the browser; HTTPS or localhost is recommended.

## What to explore

- **Find the pattern:** a field of particles gathers into the name FAYAZ, then releases again. Pointer movement influences the particles; the same button works on touch and with a keyboard.
- **A little color:** the opening portrait switches between its editorial monochrome treatment and color.
- **The work exhibit:** select a project through click, hover, touch, or arrow keys. On phones, the selected preview moves directly below its title. Each study opens in a native dialog with the question, approach, and outcome.
- **The sample data explorer:** work-arrangement controls and a metric selector update a chart, its headline figure, and its written observation. Selecting a bar inspects that month; selecting it again returns to the aggregate.
- **The toolkit:** accessible tabs connect capabilities, tools, and concrete outputs, without invented proficiency scores.
- **Write a note:** the contact invitation opens a native side-drawer dialog. Its form prepares an email draft; it does not deliver email through a server.

## Files

```text
index.html                       Semantic page, exhibits, and dialogs
styles.css                       Editorial design, responsive layouts, state transitions
app.js                           Project/skill tabs, data explorer, navigation, contact
signature.js                     Canvas particle typography and interaction
assets/muhammed-fayaz-portrait.png  AI-edited portrait based on the supplied suit photo
assets/projects.svg              Workforce concept illustration
assets/skin-analysis.svg         Machine-learning concept illustration
assets/smart-home.svg            Connected-home concept illustration
assets/Muhammed-Fayaz-CV.pdf      Supplied CV download
assets/fonts/                    Self-hosted Manrope font and its OFL license
```

Other original illustration assets remain available in `assets/`. The portrait is an AI-edited version of the supplied image, not an untouched original. Replace its source and descriptive alt text if you prefer a different photograph.

## Design and implementation

Manrope is self-hosted; its font and license come from `@fontsource-variable/manrope` version 5.2.8. Georgia supplies the editorial serif accent through the system font stack. Runtime requests stay on the same origin: there are no external fonts, scripts, analytics, or cookies.

Mobile-first Grid and Flexbox layouts expand at 600, 760, 1000, and 1200 pixels. Project preview order adapts to the selected item on smaller screens. Forms use 16px input text, and primary interactive controls have at least 44px touch height. Text and image effects use CSS; state changes use the Web Animations API where available. Native page scrolling remains intact.

The Canvas signature uses spring-like particle movement and offscreen text sampling, with a capped device pixel ratio and approximately 30fps rendering. It pauses outside the viewport and when the tab is hidden. The Motion control pauses decorative effects and saves only that preference in localStorage. System reduced-motion settings take priority and display a static signature. Native dialog focus containment, Escape dismissal, keyboard tabs, focus restoration, stable headings, explicit form labels, and live chart feedback support non-pointer use.

## Sample data and content

The explorer uses **illustrative data**, not private client data or verified research findings. The sample assumes 40 people and 20 workdays per month. For each month, workdays lost is `round(absence_rate × 40 × 20 / 100)`. The absence-rate headline is the six-month mean; the workdays headline is the six-month total. All chart values and observations come from those same arrays in `app.js`.

The biography, experience, academic studies, and impact figures are based on the supplied CV. Project screenshots are explicitly labeled as concept illustrations. The skin-classification academic result is not presented as clinically validated. The original downloadable CV includes the supplied personal/contact details.

## Contact behavior

The form validates input, percent-encodes a `mailto:` subject and body, and opens the visitor's email app. The visitor must send the draft there. The page retains the form values, explains the delivery step, and provides a fallback link. It never claims a message has been sent and does not save contact input.

For server-side delivery, connect a real form endpoint, keep credentials on the server, and show delivery success only after the endpoint accepts the message.

## Customize and deploy

Edit the page copy in `index.html`, project and skill content in `app.js`, particle behavior in `signature.js`, and design tokens in `styles.css`. Upload all four source files and the complete `assets/` directory to a static host. No build command is required. Relative URLs support GitHub Pages subdirectory deployment.

Passed 26 new Playwright checks in headless Chromium across 320, 390, 768, 1024, and 1440px viewports, exercising the interactions, sample calculations, keyboard focus, pause states, dialogs, email encoding, assets, and no-JavaScript fallback. Automated axe-core checks detected no A/AA violations on the page or open contact drawer at 320, 768, and 1440px. These checks do not establish complete accessibility or other-browser compatibility; manual keyboard, visual, and reduced-motion checks complement them.
