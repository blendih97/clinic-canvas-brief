/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <EmailShell
    preview={`You've been invited to join ${siteName}`}
    eyebrow="Invitation"
    title="You've been invited"
    ctaLabel="Accept invitation"
    ctaHref={confirmationUrl}
    footer="If you were not expecting this invitation, you can ignore this message."
  >
    <Text style={copyText}>A secure invitation has been prepared for you to join <Link href={siteUrl} style={{ color: 'hsl(42, 65%, 44%)' }}>{siteName}</Link> and start organising medical records in one place.</Text>
  </EmailShell>
)

export default InviteEmail
