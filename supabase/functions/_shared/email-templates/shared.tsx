/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailShellProps {
  preview: string
  title: string
  eyebrow: string
  ctaLabel?: string
  ctaHref?: string
  footer: string
  children: React.ReactNode
}

export const EmailShell = ({ preview, title, eyebrow, ctaLabel, ctaHref, footer, children }: EmailShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>RinVita</Text>
        <Text style={eyebrowStyle}>{eyebrow}</Text>
        <Heading style={heading}>{title}</Heading>
        <Section>{children}</Section>
        {ctaLabel && ctaHref ? (
          <Button href={ctaHref} style={button}>{ctaLabel}</Button>
        ) : null}
        <Text style={footerStyle}>{footer}</Text>
      </Container>
    </Body>
  </Html>
)

export const copyText = {
  fontSize: '15px',
  color: 'hsl(215, 10%, 50%)',
  lineHeight: '1.65',
  margin: '0 0 18px',
}

export const subtleText = {
  fontSize: '13px',
  color: 'hsl(215, 10%, 50%)',
  lineHeight: '1.6',
  margin: '16px 0 0',
}

export const codeText = {
  fontFamily: 'DM Sans, Arial, sans-serif',
  letterSpacing: '4px',
  fontSize: '28px',
  fontWeight: '700' as const,
  color: 'hsl(215, 25%, 20%)',
  textAlign: 'center' as const,
  margin: '8px 0 0',
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'DM Sans, Arial, sans-serif',
  padding: '24px 0',
}

const container = {
  padding: '36px 32px',
  border: '1px solid hsl(210, 14%, 89%)',
  borderRadius: '8px',
  maxWidth: '560px',
  margin: '0 auto',
}

const brand = {
  color: 'hsl(42, 65%, 44%)',
  fontSize: '28px',
  lineHeight: '1',
  margin: '0 0 18px',
  fontFamily: 'Cormorant Garamond, Georgia, serif',
}

const eyebrowStyle = {
  color: 'hsl(42, 65%, 44%)',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 12px',
}

const heading = {
  fontSize: '30px',
  lineHeight: '1.15',
  fontWeight: '500' as const,
  color: 'hsl(215, 25%, 20%)',
  margin: '0 0 18px',
  fontFamily: 'Cormorant Garamond, Georgia, serif',
}

const button = {
  backgroundColor: 'hsl(42, 65%, 44%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
  marginTop: '12px',
}

const footerStyle = {
  fontSize: '12px',
  color: 'hsl(215, 10%, 50%)',
  lineHeight: '1.6',
  margin: '24px 0 0',
}
