const MedicalDisclaimer = () => (
  <p className="text-[11px] text-muted-foreground mt-6 leading-relaxed">
    The information shown is extracted from your uploaded documents only. It is not medical advice. Always consult a qualified healthcare professional before making any health decisions.
  </p>
);

export const AppFooterDisclaimer = () => (
  <div className="border-t border-border mt-8 pt-4">
    <p className="text-[10px] text-muted-foreground text-center">
      RinVita organises and presents your health records. It is not a medical device and does not provide medical advice.
    </p>
  </div>
);

export default MedicalDisclaimer;
