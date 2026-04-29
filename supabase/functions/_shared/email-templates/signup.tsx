/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailShell
    preview={`Confirm your email — you're in Early Access for ${siteName}`}
    eyebrow="Early Access"
    title="You're in. Confirm your email."
    ctaLabel="Confirm email"
    ctaHref={confirmationUrl}
    footer="If you did not create this account, you can safely ignore this email."
  >
    <Text style={copyText}>
      Welcome to <Link href={siteUrl} style={{ color: 'hsl(42, 65%, 44%)' }}>{siteName}</Link>. Confirm <strong>{recipient}</strong> to unlock your secure record space.
    </Text>
    <Text style={copyText}>
      You have full free access to RinVita until <strong>1 June 2026</strong>. We'll let you know a week before paid pricing begins, with your <strong>25% lifetime discount</strong> applied automatically.
    </Text>
  </EmailShell>
)

export default SignupEmail
