import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RinVita'

interface ShareBriefProps {
  hospitalName?: string
  patientName?: string
  documentCount?: number
  shareUrl?: string
  expiresText?: string
  note?: string
}

// Sent by send-share-brief only (never directly from a browser). The email carries a
// secure link, not attachments: access can expire or be revoked, and nothing medical
// sits in the recipient's mailbox.
const ShareBriefEmail = ({ hospitalName, patientName, documentCount, shareUrl, expiresText, note }: ShareBriefProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{patientName || 'A patient'} has shared their medical records with you via {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Text style={tagline}>Your health history. Everywhere you go.</Text>
        </Section>

        <Text style={text}>Dear {hospitalName || 'colleague'},</Text>
        <Text style={text}>
          <strong>{patientName || 'A RinVita user'}</strong> has shared their medical records with you
          {typeof documentCount === 'number' && documentCount > 0 ? <>, including <strong>{documentCount} document{documentCount === 1 ? '' : 's'}</strong></> : null}.
        </Text>

        {note ? (
          <Section style={noteBox}>
            <Text style={noteLabel}>Message from the patient</Text>
            <Text style={noteText}>{note}</Text>
          </Section>
        ) : null}

        <Text style={text}>
          Open the secure link to see a structured summary, view each original document, or download
          every document as one PDF for your records. No login or software is needed.
        </Text>

        {shareUrl ? (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={shareUrl} style={button}>Open the medical records</Button>
          </Section>
        ) : null}

        <Text style={small}>
          {expiresText ? `This link expires ${expiresText}. ` : ''}The patient can revoke access at any time.
          You will be asked to confirm you are accessing the records for clinical purposes.
        </Text>
        <Text style={small}>
          If you were not expecting this email, please ignore it and contact info@rinvita.co.uk.
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
  component: ShareBriefEmail,
  subject: (data: Record<string, any>) =>
    `Medical records for ${data.patientName || 'a patient'} shared via ${SITE_NAME}`,
  displayName: 'Share Brief to a hospital',
  previewData: {
    hospitalName: 'Example City Hospital',
    patientName: 'Eleanor Morgan',
    documentCount: 3,
    shareUrl: 'https://rinvita.co.uk/share/sample-token',
    expiresText: 'on 10 November 2026 at 14:00 (UK time)',
    note: 'Please find my records ahead of my appointment on Thursday.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const header = { borderBottom: '2px solid #b8952a', paddingBottom: '12px', marginBottom: '24px' }
const brand = { fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 300, letterSpacing: '0.15em', color: '#b8952a', margin: 0 }
const tagline = { fontSize: '10px', letterSpacing: '0.15em', color: '#888', margin: '4px 0 0' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 14px' }
const noteBox = { background: '#f5f5f0', padding: '14px 16px', borderRadius: '6px', margin: '8px 0 18px', borderLeft: '3px solid #b8952a' }
const noteLabel = { fontSize: '11px', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const noteText = { fontSize: '14px', color: '#333', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' as const }
const button = { background: '#b8952a', color: '#ffffff', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }
const small = { fontSize: '12px', color: '#666', margin: '0 0 10px' }
const footer = { borderTop: '1px solid #eee', marginTop: '28px', paddingTop: '14px' }
const footerBrand = { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#b8952a', letterSpacing: '0.1em', margin: 0 }
const footerTag = { fontSize: '11px', color: '#999', margin: '4px 0 0' }
