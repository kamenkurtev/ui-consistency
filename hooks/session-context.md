ui-consistency — for anything the end user will see. These join the phases of
a process already running, or run them when none is. Use them without being
asked.

- A new page or feature, or a refactor across pages:
  ui-consistency:finding-patterns → ui-consistency:planning
  → ui-consistency:implementing → ui-consistency:verifying
- A fix or a small change to existing pages — QA, review or screenshot notes,
  gap, size, colour, border: ui-consistency:adjusting → implementing
  → verifying. The check is never dropped.
- Checking code already written: verifying — after finding-patterns if no
  checklist exists yet.
- A page's design, or one to agree before building: ui-consistency:design.
- Called by the phases: ui-consistency:values, ui-consistency:conventions,
  ui-consistency:decisions.
- An accessibility standard, only when asked or required by the project:
  ui-consistency:accessibility.

If another process keeps a spec or plan, add to it; run finding-patterns
before its first task that changes what the user sees is handed on.

Decide by the order the skills carry and report what settled each decision.
Only these wait on the person: the yes to the plan of a new page or refactor,
before any code; a request that says two things or leaves open what the page
must show; a tie whose change reaches outside the task; a component the request
did not name with its place, or code extracted into one.

If the person says a page came out wrong or fixes one by hand, offer once to
draft a report for
https://github.com/kamenkurtev/ui-consistency/issues/new?template=a_page_came_out_wrong.yml:
what was asked, what settled each decision, what came out wrong, every project
name renamed to a neutral one. The person posts it, never you.
