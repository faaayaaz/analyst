# Muhammed Fayaz — Portfolio

A complete, responsive portfolio for a data analyst and business intelligence professional. Built with semantic HTML, CSS, and vanilla JavaScript. No framework, build step, API keys, or production dependencies.

## Run locally

From the existing repository checkout:

```sh
cd /workspace/analyst
python3 -m http.server 8000
```

Open port 8000 in your local browser. Any static HTTP server works; the site also supports opening `index.html` directly, though clipboard permission and download behavior vary with browser and protocol.

## Files

```text
index.html                    Semantic page, form, and project dialog
styles.css                    Design tokens, responsive layouts, and CSS VFX
app.js                        Globe, filters, case studies, and interactions
assets/avatar.svg             Original geometric wireframe avatar
assets/muhammed-fayaz-portrait.png  AI-edited portrait based on the supplied suit photo
assets/projects.svg           Workforce dashboard concept illustration
assets/skin-analysis.svg      Machine-learning concept illustration
assets/smart-home.svg         Connected-home concept illustration
assets/favicon.svg            MF brand icon
assets/Muhammed-Fayaz-CV.pdf   Supplied CV download
```

## Tools and patterns

- **Canvas 2D:** an interactive 3D wireframe globe uses trigonometric projection and Fibonacci-distributed particles, with three orbiting light packets. Pointer movement tilts its perspective. Connect, Analyze, and Act buttons change its color and explain each step of the workflow on touch and desktop devices. Rendering is capped at approximately 30 fps and device pixel ratio at 2. The loop pauses outside the viewport or when the tab is hidden.
- **CSS VFX:** a rotating neon headline, drifting aurora and grid, seamless tool marquee, floating labels, card glows and parallax tilt, animated project sweeps, skill-bar reveals, form focus trails, and click ripples. Project effects run while cards are in view. SVG artwork stays sharp at every viewport size.
- **Responsive design:** mobile-first Grid and Flexbox; a compact phone hero and side-by-side tablet layout bring animation into the first screen. Layouts adapt at 600, 760, 900, 1050, 1100, and 1200 pixels. Form inputs use at least 16px text to avoid iOS focus zoom, and motion, menu, workflow, and filter controls provide 44px touch targets. Decorative pointer effects run only on devices with a fine pointer.
- **Scroll interaction:** a sticky navigation bar highlights the current section and displays reading progress. Statistics count up once when they enter the viewport. IntersectionObserver reveals content once; filters animate their results for mouse, touch, and keyboard users. Content stays readable when JavaScript is disabled or IntersectionObserver is unavailable.
- **Accessibility:** semantic landmarks, skip link, visible keyboard focus, explicit form labels, native required/email validation, live feedback, accessible filter state, and native dialog focus containment and Escape dismissal. A persistent Motion toggle pauses continuous effects; the browser's reduced-motion preference always takes priority. Reduced motion stops decorative animation and smooth scrolling, renders the globe as a static frame, and shows a complete static tool list. Headline words share a grid cell so the text never shifts layout; assistive technology reads a stable headline.
- **Privacy:** no cookies, analytics, external fonts, or third-party runtime requests. Only the optional motion preference is saved in localStorage. Contact input is not stored or sent to a server.

## Customize

1. Edit the biography, experience, statistics, links, and project cards in `index.html`.
2. Edit the `projects` object in `app.js` for case-study details. Keep its keys aligned with each card's `data-project` attribute.
3. Adjust the CSS `:root` tokens for the navy base and cyan, blue, purple, and magenta accents.
4. The About section uses `assets/muhammed-fayaz-portrait.png`, an AI-edited portrait based on the supplied nighttime suit photograph. The source was supplied as a chat image; this edited asset is not an untouched copy of the original upload. Replace it with the original photo if you prefer, keeping the descriptive alt text and `portrait-avatar` class. The original geometric illustration remains available as `assets/avatar.svg`.
5. Replace the concept illustrations with real project captures when available. They are labeled as concept visuals and do not imply live demos or published source code.
6. Replace the CV file as needed. The bundled PDF is the original supplied document, including its personal/contact details; update that file if you want a different public version.

The content is based on the supplied CV. Skill bars are decorative emphasis rather than measured proficiency scores. Case studies describe academic work; the machine-learning research is not presented as a clinically validated product.

## Contact behavior

The form prepares a `mailto:` draft containing the sender's name, email, topic, and message. The visitor must send it using a configured email application. It **does not deliver email by itself** and never claims a message was sent. An explicit draft link and direct email address remain available if an email app does not launch. Form values remain on the page.

For server-delivered messages, replace the submit handler with a real server or form-service endpoint and show success only after delivery is accepted. Keep provider credentials on the server. Clipboard copy requires browser permission and a secure context (HTTPS or localhost); otherwise the page displays the address to copy manually.

## Deploy

Upload `index.html`, `styles.css`, `app.js`, and `assets/` together to any static host, such as GitHub Pages, Netlify, or Cloudflare Pages. No build command is needed. Use the repository root as the publish directory. Relative assets also support deployment under a subdirectory.

## Validation

Passed 32 Playwright checks in headless Chromium, covering 320, 390, 600, 768, 1024, and 1440px viewports. Checks exercised actual Canvas frame changes, headline rotation without layout shifts, pause/resume and preference persistence, reduced motion, touch/desktop workflow controls, sticky navigation and progress, filters, dialogs, focus restoration, native validation, Unicode email-draft encoding, asset loading, and the downloadable CV. No JavaScript errors or failed asset requests were observed. Automated axe-core checks detected no WCAG A/AA violations at phone, tablet, and desktop widths; automated checks are not a complete accessibility audit. The development server is for local use; deployment and actual email delivery are separate steps.
