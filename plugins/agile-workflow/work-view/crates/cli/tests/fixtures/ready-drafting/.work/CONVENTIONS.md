# Conventions

Dedicated test fixture for the headline `--ready` fix: a drafting active item
whose dependencies are ALL terminal must surface in `--ready` and in
`--ready --stage drafting`. The golden fixture cannot prove this because its
only drafting item (feat-b) has a non-terminal dep (feat-a is implementing).
