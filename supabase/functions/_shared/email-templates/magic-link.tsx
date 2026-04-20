/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailShell
    preview={`Your login link for ${siteName}`}
    eyebrow="Secure sign in"
    title="Your login link is ready"
    ctaLabel="Sign in to RinVita"
    ctaHref={confirmationUrl}
    footer="If you did not request this link, you can ignore this email."
  >
    <Text style={copyText}>Use this secure link to continue into {siteName}. For your protection, it expires shortly.</Text>
  </EmailShell>
)

export default MagicLinkEmail
