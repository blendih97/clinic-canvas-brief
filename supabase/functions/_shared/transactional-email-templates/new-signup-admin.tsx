import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "RinVita"

interface NewSignupAdminProps {
  fullName?: string
  email?: string
  country?: string
  plan?: string
  signedUpAt?: string
}

const NewSignupAdminEmail = ({ fullName, email, country, plan, signedUpAt }: NewSignupAdminProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {SITE_NAME} signup: {fullName || email || 'a new member'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New signup on {SITE_NAME}</Heading>
        <Text style={text}>
          A new member just created an account.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Name:</strong> {fullName || '—'}</Text>
          <Text style={row}><strong>Email:</strong> {email || '—'}</Text>
          <Text style={row}><strong>Country:</strong> {country || '—'}</Text>
          <Text style={row}><strong>Plan:</strong> {plan || 'free'}</Text>
          <Text style={row}><strong>When:</strong> {signedUpAt || new Date().toISOString()}</Text>
        </Section>
        <Text style={footer}>You're receiving this because you're an admin on {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewSignupAdminEmail,
  subject: (d: Record<string, any>) => `New ${SITE_NAME} signup${d?.fullName ? `: ${d.fullName}` : ''}`,
  displayName: 'New signup (admin notification)',
  previewData: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    country: 'GB',
    plan: 'free',
    signedUpAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const card = { background: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', border: '1px solid #eceff3' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
