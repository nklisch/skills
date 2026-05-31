---
id: malformed-item
kind: epic
stage: implementing
# NOTE: intentionally missing the closing --- delimiter
# This file has no closing frontmatter fence, so the parser
# cannot find the end of the frontmatter block.
# parse_item returns ParseError("no valid frontmatter block").
