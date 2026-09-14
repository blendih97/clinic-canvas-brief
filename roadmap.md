# Launch-hardening batch

- [ ] 1. Document state: completed/failed persistence, processed_at, extracted, processing_error
- [ ] 2. Server-side free limit (3 docs) in analyse-document, 402-style code, client UpgradeModal
- [ ] 3. Real paid gating (share brief, record/imaging requests, family invite, export, uploads) + server checks
- [ ] 4. Unified enquiry pipeline: save then notify, success on notify failure, log failures
- [ ] 5. Stripe env safety: user_has_paid_access env filter, webhook env rejection, require userId, audit unmatched
- [ ] 6. Analytics funnel events + real purchase value, no health data
- [ ] 7. Share revocation: policy/RPC, UI control, public retrieval invalidation, audit event
- [ ] 8. Tests (limit, gating, env isolation, webhook env, revocation, enquiry email failure) + typecheck/build
