import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RinVita'

interface RecordRequestProps {
  providerName?: string
  patientName?: string
  requestDescription?: string
  uploadLink?: string
  isImaging?: boolean
}

const RecordRequestEmail = ({
  providerName,
  patientName,
  requestDescription,
  uploadLink,
  isImaging,
}: RecordRequestProps) => {
  const subjectIntro = isImaging
    ? 'has requested copies of their imaging studies'
    : 'has requested access to their medical records'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {patientName || 'A patient'} has requested medical records via {SITE_NAME}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>{SITE_NAME}</Heading>
            <Text style={tagline}>Your health history. Everywhere you go.</Text>
          </Section>

          <Text style={text}>
            Dear {providerName || 'Healthcare Provider'} team,
          </Text>

          <Text style={text}>
            Your patient <strong>{patientName || 'a RinVita user'}</strong> {subjectIntro}{' '}
            through {SITE_NAME}, a secure health record platform.
          </Text>

          <Text style={textBold}>They are requesting:</Text>
          <Section style={requestBox}>
            <Text style={requestText}>
              {requestDescription || 'Their full medical record on file.'}
            </Text>
          </Section>

          <Text style={text}>
            Please use the secure link below to upload the requested{' '}
            {isImaging ? 'imaging files (DICOM, JPEG, PNG, or MP4)' : 'documents'}{' '}
            directly to their health record. No login is required.
          </Text>

          {uploadLink ? (
            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button href={uploadLink} style={button}>
                Upload {isImaging ? 'Imaging' : 'Records'}
              </Button>
            </Section>
          ) : null}

          <Text style={small}>
            This link expires in 30 days. All files are transmitted securely and encrypted in transit and at rest.
          </Text>

          <Text style={small}>
            If you have any questions please contact support@rinvita.co.uk.
          </Text>

          <Section style={footer}>
            <Text style={footerBrand}>{SITE_NAME}</Text>
            <Text style={footerTag}>Your health history. Everywhere you go.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RecordRequestEmail,
  subject: (data: Record<string, any>) =>
    `Medical Records Request from ${data.patientName || 'a RinVita user'} via ${SITE_NAME}`,
  displayName: 'Record request',
  previewData: {
    providerName: 'Sample Clinic',
    patientName: 'Jane Doe',
    requestDescription: 'Full medical record from the past 5 years.',
    uploadLink: 'https://rinvita.co.uk/upload-request/sample-token',
    isImaging: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const header = { borderBottom: '2px solid #b8952a', paddingBottom: '12px', marginBottom: '24px' }
const brand = { fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 300, letterSpacing: '0.15em', color: '#b8952a', margin: 0 }
const tagline = { fontSize: '10px', letterSpacing: '0.15em', color: '#888', margin: '4px 0 0' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 14px' }
const textBold = { ...text, fontWeight: 600 as const }
const requestBox = { background: '#f5f5f0', padding: '14px 16px', borderRadius: '6px', margin: '8px 0 18px', borderLeft: '3px solid #b8952a' }
const requestText = { fontSize: '14px', color: '#333', lineHeight: '1.5', margin: 0 }
const button = { background: '#b8952a', color: '#ffffff', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }
const small = { fontSize: '12px', color: '#666', margin: '0 0 10px' }
const footer = { borderTop: '1px solid #eee', marginTop: '28px', paddingTop: '14px' }
const footerBrand = { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#b8952a', letterSpacing: '0.1em', margin: 0 }
const footerTag = { fontSize: '11px', color: '#999', margin: '4px 0 0' }
