const repo = "https://github.com/SurajsinghBayas/wakekeeper";

/**
 * Single source of truth for the current release. Downloads use GitHub's "latest release" URLs,
 * so publishing a new release with the same asset names updates the site without a redeploy.
 */
export const release = {
  version: "1.3.0",
  date: "2026-10-20",
  repo,
  /** Where testers file bugs; the test plan links to it. Set to null to hide the button. */
  issuesUrl: `${repo}/issues/new` as string | null,
  supportEmail: "surajyou45@gmail.com",
  setup: {
    file: "WakeKeeper-Setup.exe",
    href: `${repo}/releases/latest/download/WakeKeeper-Setup.exe`,
    size: "62 MB",
    sha256: "88d8859a51b4bf9f9b54700d6d4547935a344454b103fc461a69661a865732be",
  },
  portable: {
    file: "WakeKeeper-Portable.zip",
    href: `${repo}/releases/latest/download/WakeKeeper-Portable.zip`,
    size: "63 MB",
    sha256: "768901b8c10471ede17e5978dca85703d49f0bac65c4065c4bfcf956ca9c184d",
  },
} as const;
