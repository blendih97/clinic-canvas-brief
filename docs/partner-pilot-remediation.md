# Partner pilot remediation

Production website publishing is prohibited until the validation gates pass. Public marketing and the fictional partner demo remain unchanged.

## Intended semantics

- A real medical brief is claimable by one recipient session. Only a cryptographically random recipient secret can revalidate that session. The server stores its hash, never returns another session's clinical data, and checks expiry and revocation every time.
- The recipient screen clears records at expiry, on failed revalidation, and when hidden. Foreground revocation checks run every five seconds. Read, copied, photographed or downloaded information cannot be retracted.
- A supplied revoked or consumed partner invite never falls back to the public organisation link.
- Partner grants derive from joined links to active, unexpired organisations. Revoked links release seats. Suspension and expiry disable access but retain joined seats for reactivation. Public claims require an unexpired sponsorship date.
- Independently paid subscriptions and independently admin-granted complimentary access remain additive and are never deleted by partner changes.
- Legacy profile complimentary grants require explicit source attribution. Ambiguous historical grants must not be silently reclassified or erased.
- Account deletion removes only the requesting user's links, memberships, invitation identity and inviter identifiers. Audit retained after deletion contains aggregate counts, not personal identifiers or tokens.

## Validation gates

Database-backed tests of changed functions must run against an isolated database before any shared-backend migration. No live email sending, payment, TMCG organisation, or real patient data is permitted. Email confirmation, fresh extraction with failure alerts and provider invitation remain blocked unless a genuine isolated mail capture environment is available.