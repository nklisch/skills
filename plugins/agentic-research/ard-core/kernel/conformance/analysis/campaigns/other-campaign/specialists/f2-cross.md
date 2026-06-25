# f2-cross — specialist (other-campaign)

Conformance fixture: a specialist brief that lives ONLY in `other-campaign`. A handle
like `c1-f2-cross` names campaign 1 but its slug resolves here in `other-campaign`, so
the kernel resolves it by slug yet cannot bind the `cN` → it is surfaced in
`campaign_unbound` rather than passing as a clean resolution.
