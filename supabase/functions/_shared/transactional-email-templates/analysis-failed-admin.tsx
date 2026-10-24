import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  source?: string
  error?: string
  failedAt?: string
}

const AnalysisFailedAdminEmail = ({ source, error, failedAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>RinVita document analysis is failing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Document analysis failed</Heading>
        <Text style={text}>
          A document could not be processed. Patients see a "we'll retry" message and their file is kept,
          so it can be retried from the admin area once the cause is fixed. Further failures within the next hour won't send another email.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Where:</strong> {source || '—'}</Text>
          <Text style={row}><strong>Error:</strong> {error || '—'}</Text>
          <Text style={row}><strong>When:</strong> {failedAt || new Date().toISOString()}</Text>
        </Section>
        <Text style={footer}>You're receiving this because you're an admin on RinVita.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AnalysisFailedAdminEmail,
  subject: 'RinVita alert: document analysis failed',
  displayName: 'Document analysis failed (admin alert)',
  previewData: {
    source: 'analyse-document',
    error: 'Anthropic API error: 400 — invalid_request_error: Your credit balance is too low…',
    failedAt: new Date().toISOString(),
  },
  to: 'info@rinvita.co.uk',
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const card = { background: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', border: '1px solid #eceff3' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '4px 0', wordBreak: 'break-word' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
