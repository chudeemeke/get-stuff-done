**Verdict: PASS WITH CHANGES.** A/B/C are close to decision-ready. The packet separates unknown from impossible and benign interference from arbitrary adversaries. Windows applicability and authorization limits are also honest. Five concrete defects remain. Three of them change or obscure accepted guarantees beyond topology.

## Is recommending B defensible?

B is defensible, but only conditionally.

- **Why B has merit:** A has no qualified mechanism on any platform. Node has no descriptor-relative fs operations, so A probably needs native code or unexamined facilities. That is unknown, not impossible.
- **B's honesty is sound:** B correctly says it gives up guaranteed protection against benign editors, sync clients and branch tools. It correctly declines to use the adversary argument as an excuse.
- **What undermines the case:** Two unknowns could make B unusable or as costly as A: window usability (blocker 3) and child quiescence (blocker 5). The recommendation should name both as conditions, not only "operational ability."

## Blocking changes

**1. The replacement H4 text changes more than topology.** The owner approves word-for-word text, so all of these matter:

- **Standing rule narrowed:** "No silent dependency/port expansion" is a standing rule. The replacement turns it into a one-time non-approval ("not approved by this decision"). Retain the original clause verbatim.
- **Claims prohibition dropped:** "Refuse unsupported operations instead of declaring path rechecks race-free" becomes the narrower "unsupported primitive/filesystem/liveness behavior refuses." The ban on race-free claims disappears. Retain it, so window-profile user text cannot imply containment.
- **Partial list invites a wrong inference:** The "remain mandatory" list is partial. It omits:
  - one-attempt permission;
  - no replay of interrupted attempts;
  - mutable-quarantine retention;
  - separate result/verification/cleanup facts;
  - per-entry link preservation.

  A partial list invites the reading that unlisted rules are dropped. Add: "All other 2026-09-19 accepted directions remain unchanged."
- **Scope is incomplete:** "Installation, uninstall locking, rollback and recovery" omits uninstall mutation, retirement and metadata cleanup. Enumerate every mutating operation.
- **Operative accepted text is not amended:** The finding-2 bullet says "the supported mechanism must be proved or the operation refused." That bullet is not quoted or amended. Without an amendment, B leaves two conflicting authorities. Quote it and state the replacement or interpretation.

**2. Option A is internally inconsistent about what is currently accepted.**

- Two early passages present pathname stability as accepted: "Those are separate requirements" and "Minimum structure for the strict currently accepted boundary."
- The amendment instead says H4 does not settle pathname stability and that the stronger reading comes from section21's experiment.
- Fix the early paragraphs. State that A retains H4 verbatim with the object-versus-pathname question open. Object-relative authority is then a candidate needing its own contract.
- Without this, the owner may be told they are relaxing something not actually accepted, and A's cost may be overstated.

**3. The "closed" table leaves usability-determining actions unclassified.** Forbidden is the default and ancestor rows take precedence, so these gaps matter:

- (a) Creating or deleting unrelated sibling entries in ancestor directories, such as temp files in `$HOME`. If this is forbidden, the window means freezing the entire home directory.
- (b) Creating or deleting directories, not just regular files, in the target root, managed areas or unmanaged areas. Runtimes do this, for example new project or session directories.
- (c) Whether the target root counts as a "managed directory" for the regular-file create row.
- (d) Whether a live Claude/Codex session must exit when the installer is launched from it.

The owner cannot judge whether the window is sustainable until these are classified.

**4. Static-shape refusals may be new availability changes.** The table embeds refusals of pre-existing conditions, not of concurrent topology changes:

- a symlinked or reparse-point target or ancestor, such as dotfile-manager symlinks or redirected/OneDrive folders;
- multiply linked entries;
- via hard-link publication, filesystems without hard links.

For each, state whether it is unchanged accepted behavior (with citation) or a new refusal class. If new, list it in B's cost column. The row "detected-and-refused for traversal… without a safe operation" is too hedged to tell an owner whether a symlinked `~/.claude` is supported.

**5. B's "Node-only" label overstates what B avoids.**

- The packet admits no qualified descendant-quiescence mechanism exists on any platform.
- B's normal path would depend on qualifying the process graph of the pinned upstream.
- The B row must therefore say three things:
  - B may still end in refusal.
  - B may require a later separate decision: either native process containment or an explicit trust assumption about upstream behavior.
  - Choosing B does not guarantee avoiding native scope.
- Without this, the cost comparison behind the recommendation is materially misleading.

## Direct answer: which accepted guarantees would the current text change beyond topology and lock availability?

- **Changes caused by the replacement wording:**
  - the standing no-silent-expansion rule;
  - the ban on race-free claims;
  - the implicit status of unlisted accepted directions;
  - the unstated coverage of uninstall, retirement and cleanup;
  - the unamended "proved or refused" bullet.
- **Possible new refusal classes (blocker 4):**
  - static links or aliases;
  - multiply linked entries;
  - filesystems without hard links.
- **Not new:**
  - Refusing all existing locks follows from accepted takeover policy.
  - Quarantine-not-original-name semantics are consistent with captured-pre-image claims and retained mutable quarantine.

Everything else is optional wording. No further review loop is needed if these five are fixed as specified.
