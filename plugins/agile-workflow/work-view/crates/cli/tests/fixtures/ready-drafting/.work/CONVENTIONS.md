# Conventions

Dedicated test fixture for the headline `--ready` fix: a drafting active item
whose dependencies have completed implementation (`review` or terminal) must
surface in `--ready` and in `--ready --stage drafting`. This fixture uses a done
dependency; core/actionable tests cover the non-blocking review case.
