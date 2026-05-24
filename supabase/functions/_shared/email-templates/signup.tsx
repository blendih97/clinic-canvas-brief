/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => (
  <EmailShell
    preview="Confirm your RinVita account"
    eyebrow="Welcome"
    title="Welcome to RinVita."
    ctaLabel="Confirm my email"
    ctaHref={confirmationUrl}
    footer="If you didn't create this account, you can safely ignore this email."
    signOff={<>The RinVita Team · <a href="https://rinvita.co.uk" style={{ color: 'hsl(42, 65%, 44%)', textDecoration: 'none' }}>rinvita.co.uk</a></>}
  >
    <Text style={copyText}>
      You're one step away from accessing your secure health record space.
    </Text>
    <Text style={copyText}>
      Click the button below to confirm your email address and get started.
    </Text>
  </EmailShell>
)

export default SignupEmail
