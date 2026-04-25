import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RinVita'

interface DocumentProcessedProps {
  patientName?: string
  documentName?: string
  originalLanguage?: string
  documentLink?: string
  hasTranslation?: boolean
}

const DocumentProcessedEmail = ({
  patientName,
  documentName,
  originalLanguage,
  documentLink,
  hasTranslation,
}: DocumentProcessedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your document has been processed and is ready to view
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Text style={tagline}>Your health history. Everywhere you go.</Text>
        </Section>

        <Heading style={h1}>Your document is ready</Heading>

        <Text style={text}>
          {patientName ? <>Hello {patientName},<br /><br /></> : null}
          We've finished analysing
          {documentName ? <> <strong>{documentName}</strong></> : <> your document</>}.
          It's now available in your vault, with key findings extracted and
          summarised for quick review.
        </Text>

        {hasTranslation && originalLanguage ? (
          <Text style={text}>
            The original document was in <strong>{originalLanguage}</strong>. We've
            prepared a side-by-side translation so you can review it in your
            preferred language.
          </Text>
        ) : null}

        <Text style={text}>
          You can now include this record in a shareable health brief, send it to
          a clinician, or review the full extracted timeline.
        </Text>

        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={documentLink || 'https://rinvita.co.uk/app'} style={button}>
            View Document
          </Button>
        </Section>

        <Text style={small}>
          Our extractions are AI-assisted and intended to support, not replace,
          professional medical review. Always confirm important findings with a
          qualified clinician.
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
  component: DocumentProcessedEmail,
  subject: (data: Record<string, any>) =>
    data.documentName
      ? `${data.documentName} is ready in your ${SITE_NAME} vault`
      : `Your document is ready in your ${SITE_NAME} vault`,
  displayName: 'Document processing complete',
  previewData: {
    patientName: 'Jane Doe',
    documentName: 'Cardiology Consultation — 10 Apr 2026',
    originalLanguage: 'Arabic',
    hasTranslation: true,
    documentLink: 'https://rinvita.co.uk/app',
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
