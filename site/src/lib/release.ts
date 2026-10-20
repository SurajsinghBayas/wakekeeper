const repo = "https://github.com/SurajsinghBayas/wakekeeper";

/**
 * Single source of truth for the current release. Downloads use GitHub's "latest release" URLs,
 * so publishing a new release with the same asset names updates the site without a redeploy.
 */
export const release = {
  version: "1.2.1",
  date: "2026-10-20",
  repo,
  /** Where testers file bugs; the test plan links to it. Set to null to hide the button. */
  issuesUrl: `${repo}/issues/new` as string | null,
  supportEmail: "surajyou45@gmail.com",
  setup: {
    file: "WakeKeeper-Setup.exe",
    href: `${repo}/releases/latest/download/WakeKeeper-Setup.exe`,
    size: "62 MB",
    sha256: "196c0c9603235f09491d4c4b24cf671ce7b4e27b7e8d5680aa230e3a84dfdcc4",
  },
  portable: {
    file: "WakeKeeper-Portable.zip",
    href: `${repo}/releases/latest/download/WakeKeeper-Portable.zip`,
    size: "63 MB",
    sha256: "a8dbcccf99a4702ea10a78315c663f3074d4e34601a1e22b1bdfea04cac3beaa",
  },
} as const;
