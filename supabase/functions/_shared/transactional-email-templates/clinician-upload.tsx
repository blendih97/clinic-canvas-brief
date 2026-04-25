import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RinVita'

interface ClinicianUploadProps {
  patientName?: string
  clinicianName?: string
  facilityName?: string
  documentName?: string
  vaultLink?: string
}

const ClinicianUploadEmail = ({
  patientName,
  clinicianName,
  facilityName,
  documentName,
  vaultLink,
}: ClinicianUploadProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      A new medical record has been added to your {SITE_NAME} vault
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Text style={tagline}>Your health history. Everywhere you go.</Text>
        </Section>

        <Heading style={h1}>A new record was added to your vault</Heading>

        <Text style={text}>
          {patientName ? <>Hello {patientName},<br /><br /></> : null}
          {clinicianName || 'A clinician'}
          {facilityName ? <> from <strong>{facilityName}</strong></> : null}
          {' '}has uploaded a new medical record to your {SITE_NAME} vault
          {documentName ? <>: <strong>{documentName}</strong></> : null}.
        </Text>

        <Text style={text}>
          The record will be processed and translated automatically. You can review
          it, share it with another provider, or include it in your next health brief.
        </Text>

        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={vaultLink || 'https://rinvita.co.uk/app'} style={button}>
            Open Your Vault
          </Button>
        </Section>

        <Text style={small}>
          If you didn't expect this upload, please contact the clinician directly
          or get in touch with us at hello@rinvita.co.uk.
        </Text>

        <Section style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerTag}>Your health history. Everywhere you go.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ClinicianUploadEmail,
  subject: (data: Record<string, any>) =>
    `New record added to your ${SITE_NAME} vault${data.facilityName ? ` from ${data.facilityName}` : ''}`,
  displayName: 'Clinician upload notification',
  previewData: {
    patientName: 'Jane Doe',
    clinicianName: 'Dr. Sarah Khan',
    facilityName: 'Royal London Hospital',
    documentName: 'MRI Report — 12 Apr 2026',
    vaultLink: 'https://rinvita.co.uk/app',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const header = { borderBottom: '2px solid #b8952a', paddingBottom: '12px', marginBottom: '24px' }
const brand = { fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 300, letterSpacing: '0.15em', color: '#b8952a', margin: 0 }
const tagline = { fontSize: '10px', letterSpacing: '0.15em', color: '#888', margin: '4px 0 0' }
const h1 = { fontSize: '20px', color: '#1a1a1a', fontWeight: 500 as const, margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 14px' }
const button = { background: '#b8952a', color: '#ffffff', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }
const small = { fontSize: '12px', color: '#666', margin: '0 0 10px' }
const footer = { borderTop: '1px solid #eee', marginTop: '28px', paddingTop: '14px' }
const footerBrand = { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#b8952a', letterSpacing: '0.1em', margin: 0 }
const footerTag = { fontSize: '11px', color: '#999', margin: '4px 0 0' }
