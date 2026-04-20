/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailShell
    preview={`Reset your password for ${siteName}`}
    eyebrow="Account security"
    title="Reset your password"
    ctaLabel="Choose a new password"
    ctaHref={confirmationUrl}
    footer="If you did not request this reset, no changes have been made to your account."
  >
    <Text style={copyText}>We received a request to reset your {siteName} password. Use the button below to set a new one.</Text>
  </EmailShell>
)

export default RecoveryEmail
