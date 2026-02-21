# Upstream Outreach Drafts

## Context

@chude/get-stuff-done is a fork of glittercowboy/get-shit-done (TACHES), rebranded and published under a scoped npm package. The fork maintains upstream compatibility and has accumulated 14 phases of development work across v0.1.0 and v0.2.0, including security hardening, cross-platform support (Windows), CI/CD, and a comprehensive test suite. No prior relationship exists with the upstream maintainer. The upstream repo is MIT-licensed with 16k+ stars.

These are two alternative outreach emails. Send one, not both.

## Email 1: Option A - Contributing Improvements Back

Subject: Contributing cross-platform and security improvements back to GSD

Hi TACHES,

I maintain a fork of get-shit-done called get-stuff-done (@chude/get-stuff-done on npm). I want to be upfront: it's a rebranded fork for my own development workflow. The core GSD methodology is unchanged.

Over the past few months I've built a number of improvements on top of the original codebase that might be useful upstream. Specifically:

- **Cross-platform support:** Windows compatibility via platform detection, path normalization (pathe), and a symlink/junction/copy fallback chain. All hooks are pure Node.js with no bash dependency.
- **Security hardening:** Input validation module covering git SHA, branch name, and config path formats. ESLint with security plugin. Shell command hardening. Pre-publish conflict marker detection.
- **CI/CD:** GitHub Actions with a cross-platform matrix (Ubuntu, macOS, Windows). 366 tests with bun:test, including source-to-installed parity checks.
- **Hook bundling:** esbuild bundling so hooks work in copy-mode installs without requiring the full source tree.
- **16 missing workflow files** that fill gaps in the agent/skill coverage.

I'd be happy to contribute any or all of this back as PRs, adapted to fit GSD's conventions. I understand the upstream has its own direction, so I'm not assuming any of this is wanted -- just offering. If there are specific areas where contributions would be welcome, I'd prioritize those.

Fork repo for reference: github.com/chudeemeke/get-stuff-done

Best,
Chude

## Email 2: Option B - Plugin/Extension Architecture

Subject: Interest in plugin/extension architecture for GSD

Hi TACHES,

I maintain a fork of get-shit-done and have been building on top of it for a few months. The fork is rebranded (@chude/get-stuff-done) but preserves GSD's core methodology.

One challenge I've run into is that building on GSD currently requires forking. Hooks, workflows, agent definitions, and configuration are all embedded in the main tree. This means anyone who wants to customize or extend GSD has to maintain a full fork and handle upstream sync manually -- which is doable, but creates ongoing maintenance overhead.

I wanted to ask whether you've considered (or would be open to) a plugin or extension architecture. Concretely, something like:

- **Hook extension points** where external packages can register pre/post hooks without modifying the core hook files
- **Workflow/skill registration** so custom workflows can be added from separate packages
- **Configuration layering** where user/project configs extend (rather than replace) the base config

This would let people build on GSD without forking, which I think would benefit the ecosystem as the project grows. People already fork for customization -- an extension model would give them a supported path.

I've built some of the primitives for this in my fork (config layering, hook bundling, platform abstraction) and would be willing to help design and implement an extension architecture upstream if there's interest.

No pressure either way. GSD works well as-is and I understand this is a significant architectural decision.

Best,
Chude

---
*Drafted: 2026-02-19*
