const MedicalDisclaimer = () => (
  <p className="text-[11px] text-muted-foreground mt-6 leading-relaxed">
    The information shown is extracted from your uploaded documents for personal record-keeping only. It is not medical advice. Always consult a qualified healthcare professional.
  </p>
);

export const AppFooterDisclaimer = () => (
  <div className="border-t border-border mt-8 pt-4">
    <p className="text-[10px] text-muted-foreground text-center">
      RinVita is not a medical device and does not provide medical advice. ICO Registration ZC123014.
    </p>
  </div>
);

export default MedicalDisclaimer;
