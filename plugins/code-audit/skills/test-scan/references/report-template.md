# Test-Scan Report Template

Use this structure for `test-scan-report.md` or the path supplied with `--output`.

```markdown
# Test Scan Report

**Generated**: <ISO-date>
**Scope**: <whole repo | path/glob>

## Test surface profile

- Languages / frameworks: <list>
- Test commands: <commands found>
- Test layers present: <unit/integration/e2e/property/snapshot/etc.>
- Behavioral contract sources: <docs/specs/public APIs/schemas/none>

## Test inventory

| Layer | Count | Notes |
|---|---:|---|
| Unit | <n> | <summary> |
| Integration | <n> | <summary> |
| E2E | <n> | <summary> |
| Property/fuzz | <n> | <summary> |
| Snapshot | <n> | <summary> |

## Verified strengths

- `<file:line>` - <what this test covers well>

## Coverage gaps

### Critical (<n>)

#### <title>
- **Contract source**: `<file:line>` or <public API/schema/doc>
- **Affected code**: `<file:line>` or <symbol>
- **Missing coverage**: <what behavior is untested>
- **Suggested test**: <test direction>

### High (<n>)

<same shape>

### Medium (<n>)

<same shape>

### Low (<n>)

<same shape; compress if many>

## Bad-test findings

- `<file:line>` - <weak assertion / implementation mirroring / stale fixture / flake / over-mock> - <recommended rework>

## Spec gaps

- <behavior area where expected behavior is not defined clearly enough to test>

## Recommended test plan

1. <highest-value test to add>
2. <highest-value bad test to rework>
3. <spec gap to settle before writing tests>
```

## Rules

- Tie every coverage gap to a contract source or explicitly classify it as a spec gap.
- Separate missing tests from bad existing tests.
- Keep suggested tests as directions, not full implementations.
