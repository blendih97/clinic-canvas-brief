/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, codeText, copyText } from './shared.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell
    preview="Your verification code"
    eyebrow="Security check"
    title="Confirm it’s you"
    footer="This code expires shortly. If you did not request it, you can ignore this email."
  >
    <Text style={copyText}>Enter this verification code to continue your secure action in RinVita.</Text>
    <Text style={codeText}>{token}</Text>
  </EmailShell>
)

export default ReauthenticationEmail
