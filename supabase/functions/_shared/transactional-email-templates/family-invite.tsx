import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RinVita'

interface FamilyInviteProps {
  inviterName?: string
  inviteLink?: string
}

const FamilyInviteEmail = ({ inviterName, inviteLink }: FamilyInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {inviterName || 'A RinVita user'} has invited you to join their family vault
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Text style={tagline}>Your health history. Everywhere you go.</Text>
        </Section>

        <Heading style={h1}>You've been invited to a family vault</Heading>

        <Text style={text}>
          <strong>{inviterName || 'A RinVita user'}</strong> has invited you to join their
          family vault on {SITE_NAME}. As a family member, you'll have your own private
          health record while the account owner can help manage and view your records.
        </Text>

        <Text style={text}>
          Each family member has fully private health records. The account owner can view
          your vault to help coordinate care, but no one else can access your information.
        </Text>

        {inviteLink ? (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={inviteLink} style={button}>
              Accept Invitation
            </Button>
          </Section>
        ) : (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href="https://rinvita.co.uk/auth" style={button}>
              Create Your Account
            </Button>
          </Section>
        )}

        <Text style={small}>
          If you weren't expecting this invitation, you can safely ignore this email.
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
  component: FamilyInviteEmail,
  subject: (data: Record<string, any>) =>
    `${data.inviterName || 'A RinVita user'} invited you to their family vault on ${SITE_NAME}`,
  displayName: 'Family invite',
  previewData: {
    inviterName: 'Jane Doe',
    inviteLink: 'https://rinvita.co.uk/auth',
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
