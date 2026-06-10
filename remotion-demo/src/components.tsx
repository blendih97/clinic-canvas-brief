import React from "react";
import { COLORS } from "./theme";
import { cormorant } from "./MainVideo";

export const LogoMark: React.FC<{ size?: number; color?: string }> = ({ size = 64, color = COLORS.gold }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke={color} strokeWidth="1.2" fill="none" />
    <polygon points="14,8 20,11.5 20,16.5 14,20 8,16.5 8,11.5" fill={color} opacity="0.2" />
    <circle cx="14" cy="14" r="2.5" fill={color} />
  </svg>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontFamily: cormorant, fontSize: 16, color: COLORS.gold,
    letterSpacing: "0.36em", textTransform: "uppercase", fontWeight: 400,
  }}>{children}</div>
);

export const TimecodeBadge: React.FC<{ time: string }> = ({ time }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10,
    padding: "8px 16px",
    border: `1px solid ${COLORS.goldBorder}`,
    background: COLORS.goldSoft,
    borderRadius: 2,
    fontFamily: cormorant, fontSize: 18, letterSpacing: "0.1em",
    color: COLORS.gold, fontWeight: 400,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gold }} />
    {time}
  </div>
);
