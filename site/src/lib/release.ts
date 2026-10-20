const repo = "https://github.com/SurajsinghBayas/wakekeeper";

/**
 * Single source of truth for the current release. Downloads use GitHub's "latest release" URLs,
 * so publishing a new release with the same asset names updates the site without a redeploy.
 */
export const release = {
  version: "1.1.0",
  date: "2026-10-20",
  repo,
  /** Where testers file bugs; the test plan links to it. Set to null to hide the button. */
  issuesUrl: `${repo}/issues/new` as string | null,
  setup: {
    file: "WakeKeeper-Setup.exe",
    href: `${repo}/releases/latest/download/WakeKeeper-Setup.exe`,
    size: "62 MB",
    sha256: "f03c33cfcfe2c6ba78072e69e02918646af16af5a9a362fcde7635ddd16935e5",
  },
  portable: {
    file: "WakeKeeper-Portable.zip",
    href: `${repo}/releases/latest/download/WakeKeeper-Portable.zip`,
    size: "63 MB",
    sha256: "a3a320fe78376887d267755e0b8f6502516e5cc7edcdbc3f45772065d4a763f5",
  },
} as const;
