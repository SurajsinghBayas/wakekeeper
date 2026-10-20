# Contributing to WakeKeeper

Thanks for helping. Bug reports, testing on different laptops, wording fixes and code are all welcome.

## Ways to help

- **Test it.** Run through the [test plan on the website](https://www.wakekeeper.tech/#test) on your PC and report anything odd.
- **Report a bug.** Use the [bug report form](https://github.com/SurajsinghBayas/wakekeeper/issues/new/choose) and attach a diagnostic log (right-click the cup › Help & Feedback › Diagnostic logging).
- **Suggest a feature.** Open a feature idea and describe the situation you're in, not just the button you want.
- **Send code.** Look for issues labelled [`good first issue`](https://github.com/SurajsinghBayas/wakekeeper/labels/good%20first%20issue) or [`help wanted`](https://github.com/SurajsinghBayas/wakekeeper/labels/help%20wanted).

## Making a change

1. For anything bigger than a small fix, open an issue first so we can agree on the approach before you spend time on it.
2. Fork the repo and create a branch from `main`, e.g. `fix/lid-restore-after-crash`.
3. Make the change and build it:

   ```bash
   # App: needs the .NET 8 SDK (builds on Windows, macOS or Linux)
   dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -p:DebugType=none -warnaserror -o out/full

   # Website: needs Node 24 and pnpm
   cd site && pnpm install && pnpm dev
   ```

4. Try it on a real Windows 10 or 11 PC. Anything touching power, lid or sleep settings must be checked on a laptop.
5. Open a pull request against `main` and fill in the template.

## What a good pull request looks like

- One focused change per pull request.
- Builds with no warnings. CI fails on any compiler warning.
- Matches the code around it: same naming, comment style and plain wording in menus.
- Never leaves a user's PC in a changed state. Any power or lid setting WakeKeeper changes must be restored when the session ends, when the app exits and after a crash.
- No network calls, telemetry or new dependencies without discussing it in an issue first.

## How pull requests are reviewed and merged

1. **Automatic checks.** Every pull request builds the app on Windows and builds the website. Both must pass. A built `WakeKeeper.exe` is attached to each run so reviewers can try it.
2. **Review.** The maintainer is asked to review automatically and aims to reply within a week. You may be asked for changes; push more commits to the same branch.
3. **Merge.** Approved pull requests are squash-merged into `main`, so your branch becomes one clean commit with your name on it.
4. **Release.** Merged changes ship in the next release. Website changes go live as soon as they're merged.

## License

WakeKeeper is MIT licensed. By sending a pull request you agree that your contribution is released under the same [license](LICENSE).
