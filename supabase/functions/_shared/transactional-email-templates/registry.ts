/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as recordRequest } from './record-request.tsx'
import { template as familyInvite } from './family-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'record-request': recordRequest,
  'family-invite': familyInvite,
}
