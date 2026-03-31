# Contributing

## Doc-with-Code Policy

**Every pull request that changes code must include corresponding documentation updates.**

### What to update

| If you change… | Update… |
|----------------|---------|
| A service or `http-common.js` | `docs/SUBSYSTEM_OVERVIEW.md` §1–2 |
| A component or route | `docs/SUBSYSTEM_OVERVIEW.md` §3–4 |
| Architectural patterns | `docs/EXTENSION_GUIDE.md` |
| Introduce or mitigate a risk | `docs/RISK_REGISTER.md` |

### PR Checklist

- [ ] Code changes compile and pass `npm test`
- [ ] Documentation updated per table above
- [ ] Risk register reviewed for new/resolved risks
- [ ] No unrelated formatting changes mixed in