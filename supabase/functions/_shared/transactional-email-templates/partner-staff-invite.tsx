import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { partnerName?: string; partnerLogoUrl?: string | null; role?: string; inviteLink?: string }

const PartnerStaffInviteEmail = ({ partnerName, partnerLogoUrl, role, inviteLink }: Props) => {
  const name = partnerName || 'Your organisation'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Join {name} on RinVita</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            {partnerLogoUrl ? <Img src={partnerLogoUrl} alt={name} height="40" style={{ marginBottom: '10px', maxWidth: '180px' }} /> : null}
            <Heading style={brand}>RinVita</Heading>
          </Section>
          <Heading style={h1}>You've been invited to the {name} partner portal</Heading>
          <Text style={text}>
            You've been added as a {role || 'team member'} for {name} on RinVita. In the partner portal you can invite patients and see who has joined. The portal never shows patients' medical records.
          </Text>
          <Text style={text}>Sign up or sign in with this email address to accept.</Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={inviteLink || 'https://rinvita.co.uk/partner'} style={button}>Accept invitation</Button>
          </Section>
          <Text style={small}>If you weren't expecting this invitation, you can safely ignore this email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PartnerStaffInviteEmail,
  subject: (d: Record<string, any>) => `Join ${d.partnerName || 'your organisation'} on RinVita`,
  displayName: 'Partner staff invite',
  previewData: { partnerName: 'Example Clinic', role: 'administrator', inviteLink: 'https://rinvita.co.uk/auth?mode=signup&staff=1&next=/partner' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const header = { borderBottom: '2px solid #b8952a', paddingBottom: '12px', marginBottom: '24px' }
const brand = { fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 300, letterSpacing: '0.15em', color: '#b8952a', margin: 0 }
const h1 = { fontSize: '20px', color: '#1a1a1a', fontWeight: 500 as const, margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 14px' }
const button = { background: '#b8952a', color: '#ffffff', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }
const small = { fontSize: '12px', color: '#666', margin: '0 0 10px' }
