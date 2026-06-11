import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "RinVita"

interface ClinicEnquiryAdminProps {
  name?: string
  email?: string
  organisation?: string
  role?: string
  patientsPerMonth?: string
  message?: string
  submittedAt?: string
}

const ClinicEnquiryAdminEmail = ({
  name, email, organisation, role, patientsPerMonth, message, submittedAt,
}: ClinicEnquiryAdminProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New clinic enquiry from {organisation || name || 'a clinic'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New clinic / partnership enquiry</Heading>
        <Text style={text}>A new enquiry was submitted on the {SITE_NAME} clinics page.</Text>
        <Section style={card}>
          <Text style={row}><strong>Name:</strong> {name || '—'}</Text>
          <Text style={row}><strong>Email:</strong> {email || '—'}</Text>
          <Text style={row}><strong>Organisation:</strong> {organisation || '—'}</Text>
          <Text style={row}><strong>Role:</strong> {role || '—'}</Text>
          <Text style={row}><strong>International patients / month:</strong> {patientsPerMonth || '—'}</Text>
          <Text style={row}><strong>When:</strong> {submittedAt || new Date().toISOString()}</Text>
        </Section>
        {message && (
          <Section style={card}>
            <Text style={{ ...row, fontWeight: 'bold', marginBottom: 8 }}>Message</Text>
            <Text style={{ ...row, whiteSpace: 'pre-wrap' }}>{message}</Text>
          </Section>
        )}
        <Text style={footer}>You're receiving this because you're an admin on {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ClinicEnquiryAdminEmail,
  subject: (d: Record<string, any>) =>
    `New clinic enquiry${d?.organisation ? `: ${d.organisation}` : d?.name ? `: ${d.name}` : ''}`,
  to: 'hello@rinvita.co.uk',
  displayName: 'Clinic enquiry (admin notification)',
  previewData: {
    name: 'Dr Aisha Patel',
    email: 'aisha@exampleclinic.com',
    organisation: 'Mayfair Private Clinic',
    role: 'Medical Director',
    patientsPerMonth: '200-500',
    message: 'We see a lot of international patients arriving with records in Arabic and French.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const card = { background: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', border: '1px solid #eceff3', marginBottom: '12px' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
