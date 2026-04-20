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
    preview={`Confirm your email for ${siteName}`}
    eyebrow="Account setup"
    title="Confirm your email"
    ctaLabel="Confirm email"
    ctaHref={confirmationUrl}
    footer="If you did not create this account, you can safely ignore this email."
  >
    <Text style={copyText}>
      Welcome to <Link href={siteUrl} style={{ color: 'hsl(42, 65%, 44%)' }}>{siteName}</Link>. Confirm <strong>{recipient}</strong> to finish creating your secure record space.
    </Text>
  </EmailShell>
)

export default SignupEmail
