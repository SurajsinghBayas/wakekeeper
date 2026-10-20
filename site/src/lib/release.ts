/** Single source of truth for the current release. Update when publishing a new build. */
export const release = {
  version: "1.0.0",
  date: "2026-10-20",
  /** Where testers file bugs; the test plan links to it. Set to null to hide the button. */
  issuesUrl: "https://github.com/SurajsinghBayas/wakekeeper/issues/new" as string | null,
  builds: [
    {
      id: "standalone",
      name: "Standalone",
      file: "WakeKeeper-1.0.0-win-x64.zip",
      href: "https://github.com/SurajsinghBayas/wakekeeper/releases/download/v1.0.0/WakeKeeper-1.0.0-win-x64.zip",
      size: "63 MB",
      sha256: "9cc2f3c9b8528774b5d492c143af6c57fbb828736541456a62c56afb531c73d2",
      note: "Everything included. Unzip and run.",
      recommended: true,
    },
    {
      id: "lite",
      name: "Lite",
      file: "WakeKeeper-1.0.0-win-x64-lite.zip",
      href: "https://github.com/SurajsinghBayas/wakekeeper/releases/download/v1.0.0/WakeKeeper-1.0.0-win-x64-lite.zip",
      size: "93 KB",
      sha256: "c3adaf81e781b6913178a195a7330c601bf7c406c33fa0dc5ee0e9f03a817ce9",
      note: "Needs the .NET 8 Desktop Runtime installed.",
      recommended: false,
    },
  ],
} as const;

export type Build = (typeof release.builds)[number];
