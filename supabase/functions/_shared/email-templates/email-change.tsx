/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, copyText } from './shared.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EmailShell
    preview={`Confirm your email change for ${siteName}`}
    eyebrow="Account update"
    title="Confirm your new email"
    ctaLabel="Confirm email change"
    ctaHref={confirmationUrl}
    footer="If you did not request this change, secure your account immediately."
  >
    <Text style={copyText}>You asked to update your RinVita sign-in email from <strong>{email}</strong> to <strong>{newEmail}</strong>.</Text>
  </EmailShell>
)

export default EmailChangeEmail
