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
  signOff?: React.ReactNode
  children: React.ReactNode
}

export const EmailShell = ({ preview, title, eyebrow, ctaLabel, ctaHref, footer, signOff, children }: EmailShellProps) => (
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
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={ctaHref} style={button}>{ctaLabel}</Button>
          </Section>
        ) : null}
        <Text style={footerStyle}>{footer}</Text>
        {signOff ? <Text style={signOffStyle}>{signOff}</Text> : null}
      </Container>
    </Body>
  </Html>
)

export const copyText = {
  fontSize: '15px',
  color: 'hsl(215, 15%, 30%)',
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
  padding: '40px 32px',
  border: '1px solid hsl(210, 14%, 89%)',
  borderRadius: '10px',
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
}

const brand = {
  color: '#C9A84C',
  fontSize: '32px',
  lineHeight: '1',
  letterSpacing: '4px',
  margin: '0 0 24px',
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  fontWeight: '300' as const,
  textAlign: 'center' as const,
}

const eyebrowStyle = {
  color: '#C9A84C',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 12px',
}

const heading = {
  fontSize: '30px',
  lineHeight: '1.2',
  fontWeight: '400' as const,
  color: 'hsl(215, 25%, 20%)',
  margin: '0 0 22px',
  fontFamily: 'Cormorant Garamond, Georgia, serif',
}

const button = {
  backgroundColor: '#C9A84C',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.5px',
}

const footerStyle = {
  fontSize: '12px',
  color: 'hsl(215, 10%, 50%)',
  lineHeight: '1.6',
  margin: '28px 0 0',
}

const signOffStyle = {
  fontSize: '12px',
  color: 'hsl(215, 10%, 50%)',
  lineHeight: '1.6',
  margin: '14px 0 0',
}
