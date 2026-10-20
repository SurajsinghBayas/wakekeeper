// Renders the page to static HTML after `vite build` and adds structured data, so search engines,
// link previews and AI crawlers read the full content without running JavaScript.
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const site = "https://www.wakekeeper.tech";
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const ssr = fileURLToPath(new URL("../dist-ssr/", import.meta.url));

const { render, faqs, release } = await import(`${ssr}entry-server.js`);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WakeKeeper",
    url: `${site}/`,
    description:
      "Free Windows tray app that keeps your PC awake while AI agents, builds, downloads and backups run, even with the laptop lid closed.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    softwareVersion: release.version,
    datePublished: release.date,
    downloadUrl: release.setup.href,
    fileSize: release.setup.size,
    image: `${site}/icon-512.png`,
    screenshot: `${site}/og.png`,
    isAccessibleForFree: true,
    license: `${release.repo}/blob/main/LICENSE`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Suraj Bayas", url: "https://github.com/SurajsinghBayas" },
    codeRepository: release.repo,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WakeKeeper",
    url: `${site}/`,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

const script = `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`;
const template = await readFile(`${dist}index.html`, "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error("index.html has no empty #root to fill");

const html = template
  .replace('<div id="root"></div>', `<div id="root">${render()}</div>`)
  .replace("</head>", `    ${script}\n  </head>`);

await writeFile(`${dist}index.html`, html);
await rm(ssr, { recursive: true, force: true });
console.log(`Prerendered index.html (${Math.round(html.length / 1024)} KB) with ${faqs.length} FAQ entries`);
