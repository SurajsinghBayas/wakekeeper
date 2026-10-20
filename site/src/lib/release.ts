const repo = "https://github.com/SurajsinghBayas/wakekeeper";

/**
 * Single source of truth for the current release. Downloads use GitHub's "latest release" URLs,
 * so publishing a new release with the same asset names updates the site without a redeploy.
 */
export const release = {
  version: "1.2.0",
  date: "2026-10-20",
  repo,
  /** Where testers file bugs; the test plan links to it. Set to null to hide the button. */
  issuesUrl: `${repo}/issues/new` as string | null,
  setup: {
    file: "WakeKeeper-Setup.exe",
    href: `${repo}/releases/latest/download/WakeKeeper-Setup.exe`,
    size: "62 MB",
    sha256: "8a93cd174ccdb6aea66cd5684c9c22c94eba3cdf55da01b61f5a4cc5663c7926",
  },
  portable: {
    file: "WakeKeeper-Portable.zip",
    href: `${repo}/releases/latest/download/WakeKeeper-Portable.zip`,
    size: "63 MB",
    sha256: "8cd319036740d8c517b52953ab26c540bdef961dc27f8066b47c7dbb48bb0427",
  },
} as const;
