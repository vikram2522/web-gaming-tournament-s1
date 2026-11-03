<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep tournament fee, deadline and countdown calculation in the browser-safe tournament module so the page and rule tests share one source of truth.
- Registrations go through server functions in src/lib/registration.functions.ts (admin client + register_team DB function assigns slots atomically); the registrations table and payment-proofs bucket have no public access, so the browser never reads them directly.
- Organizer review (/organizer) is gated by the ORGANIZER_PASSCODE secret checked inside each organizer server function; why: single organizer, no accounts needed.
