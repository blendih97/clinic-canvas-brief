import { MarketingFooter, MarketingNav, MarketingStyles, marketingColors, useMarketingBreakpoint } from "@/components/marketing/shared";
import SEO from "@/components/SEO";

const PrivacyPage = () => {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const headingStyle: React.CSSProperties = {
    fontFamily: "Cormorant Garamond",
    fontSize: isMobile ? 22 : 26,
    fontWeight: 400,
    color: marketingColors.ink,
    marginTop: 36,
    marginBottom: 12,
  };
  const subHeadingStyle: React.CSSProperties = {
    fontFamily: "Cormorant Garamond",
    fontSize: isMobile ? 18 : 20,
    fontWeight: 500,
    color: marketingColors.ink,
    marginTop: 20,
    marginBottom: 8,
  };
  const bodyStyle: React.CSSProperties = {
    fontSize: 14.5,
    lineHeight: 1.8,
    color: marketingColors.mutedText,
    fontWeight: 300,
    marginBottom: 12,
  };
  const listStyle: React.CSSProperties = {
    ...bodyStyle,
    paddingLeft: 20,
    marginBottom: 16,
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <MarketingStyles />
      <MarketingNav currentPage="home" />
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 56 : 80}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span className="marketing-section-label">Legal</span>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : 56, fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: marketingColors.softText, letterSpacing: "0.04em", marginBottom: 28 }}>
            RinVita — last updated 8 May 2026
          </p>

          {/* Interim notice callout */}
          <div style={{
            background: marketingColors.goldSoft,
            border: `1px solid ${marketingColors.goldBorder}`,
            borderLeft: `3px solid ${marketingColors.gold}`,
            padding: "18px 22px",
            borderRadius: 6,
            marginBottom: 36,
          }}>
            <p style={{
              fontFamily: "Cormorant Garamond",
              fontStyle: "italic",
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.6,
              color: marketingColors.gold,
              margin: 0,
              fontWeight: 500,
            }}>
              This Privacy Policy is currently being reviewed and updated by our solicitor. The version below is our current draft. An updated version will be published shortly. For any questions in the meantime, please contact <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold, textDecoration: "underline" }}>hello@rinvita.co.uk</a>.
            </p>
          </div>

          <h2 style={headingStyle}>Summary</h2>
          <h3 style={subHeadingStyle}>Data we collect automatically</h3>
          <p style={bodyStyle}>We automatically collect data from you, for example when you visit RinVita.</p>
          <ul style={listStyle}><li>Usage Data</li><li>Trackers</li></ul>

          <h3 style={subHeadingStyle}>Trusted third parties help us to process it</h3>
          <ul style={listStyle}><li>Stripe, Inc.</li><li>Supabase, Inc.</li></ul>

          <h3 style={subHeadingStyle}>How we use them</h3>
          <ul style={listStyle}>
            <li>Hosting and backend infrastructure</li>
            <li>Registration and authentication</li>
            <li>Access to third-party accounts</li>
            <li>Manage your privacy preferences</li>
          </ul>

          <h3 style={subHeadingStyle}>Data you give to us</h3>
          <p style={bodyStyle}>We collect the data you give to us, for example when you create an account on RinVita.</p>
          <ul style={listStyle}>
            <li>Account log-in</li><li>First name</li><li>Last name</li><li>Email address</li><li>Payment info</li>
          </ul>

          <h2 style={headingStyle}>Owner and Data Controller</h2>
          <p style={bodyStyle}>
            RinVita Ltd<br />
            Unit A435<br />
            4-6 Greatorex Street<br />
            London, E1 5NF<br />
            United Kingdom
          </p>
          <p style={bodyStyle}>
            Company registration number: 17163153<br />
            ICO registration number: ZC123014<br />
            Owner contact email: <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a>
          </p>

          <h2 style={headingStyle}>Type of Data we collect</h2>
          <p style={bodyStyle}>Among the types of Personal Data that this Application collects, by itself or through third parties, there are: Usage Data, Trackers, account log-in, first name, last name, email address, payment info.</p>
          <p style={bodyStyle}>Complete details on each type of Personal Data collected are provided in the dedicated sections of this privacy policy or by specific explanation texts displayed prior to the Data collection. Personal Data may be freely provided by the User, or, in case of Usage Data, collected automatically when using this Application.</p>
          <p style={bodyStyle}>Unless specified otherwise, all Data requested by this Application is mandatory and failure to provide this Data may make it impossible for this Application to provide its services. In cases where this Application specifically states that some Data is not mandatory, Users are free not to communicate this Data without consequences to the availability or the functioning of the Service.</p>
          <p style={bodyStyle}>Users are responsible for any third-party Personal Data obtained, published or shared through this Application.</p>

          <h2 style={headingStyle}>Mode and place of processing the Data</h2>
          <h3 style={subHeadingStyle}>Methods of processing</h3>
          <p style={bodyStyle}>The Owner takes appropriate security measures to prevent unauthorized access, disclosure, modification, or unauthorized destruction of the Data. The Data processing is carried out using computers and/or IT enabled tools, following organizational procedures and modes strictly related to the purposes indicated. In addition to the Owner, in some cases, the Data may be accessible to certain types of persons in charge, involved with the operation of this Application (administration, sales, marketing, legal, system administration) or external parties (such as third-party technical service providers, mail carriers, hosting providers, IT companies, communications agencies) appointed, if necessary, as Data Processors by the Owner. The updated list of these parties may be requested from the Owner at any time.</p>
          <h3 style={subHeadingStyle}>Place</h3>
          <p style={bodyStyle}>The Data is processed at the Owner's operating offices and in any other places where the parties involved in the processing are located. Depending on the User's location, data transfers may involve transferring the User's Data to a country other than their own. To find out more about the place of processing of such transferred Data, Users can check the section containing details about the processing of Personal Data.</p>
          <h3 style={subHeadingStyle}>Retention time</h3>
          <p style={bodyStyle}>Unless specified otherwise in this document, Personal Data shall be processed and stored for as long as required by the purpose they have been collected for and may be retained for longer due to applicable legal obligation or based on the Users' consent.</p>

          <h2 style={headingStyle}>The purposes of processing</h2>
          <p style={bodyStyle}>The Data concerning the User is collected to allow the Owner to provide its Service, comply with its legal obligations, respond to enforcement requests, protect its rights and interests (or those of its Users or third parties), detect any malicious or fraudulent activity, as well as the following:</p>
          <ul style={listStyle}>
            <li>Hosting and backend infrastructure</li>
            <li>Registration and authentication</li>
            <li>Access to third-party accounts</li>
          </ul>

          <h2 style={headingStyle}>Detailed information on the processing of Personal Data</h2>
          <h3 style={subHeadingStyle}>Access to third-party accounts</h3>
          <p style={bodyStyle}>This type of service allows this Application to access Data from your account on a third-party service and perform actions with it. These services are not activated automatically, but require explicit authorization by the User.</p>
          <p style={bodyStyle}><strong>Stripe, Inc. — Stripe account access</strong><br />Company: Stripe, Inc.<br />Place of processing: United States<br />Personal Data processed: email address (+5)</p>

          <h3 style={subHeadingStyle}>Hosting and backend infrastructure</h3>
          <p style={bodyStyle}>This type of service has the purpose of hosting Data and files that enable this Application to run and be distributed or to provide a ready-made infrastructure to run specific features or parts of this Application.</p>
          <p style={bodyStyle}><strong>Supabase, Inc.</strong><br />Company: Supabase, Inc.<br />Place of processing: Ireland (EU West)<br />Personal Data processed: Trackers (+2)</p>

          <h3 style={subHeadingStyle}>Registration and authentication</h3>
          <p style={bodyStyle}>By registering or authenticating, Users allow this Application to identify them and give them access to dedicated services.</p>
          <p style={bodyStyle}><strong>Supabase Auth (Supabase, Inc.)</strong><br />Company: Supabase, Inc.<br />Place of processing: Ireland (EU West)<br />Personal Data processed: account log-in (+2)</p>

          <h2 style={headingStyle}>Cookie Policy</h2>
          <p style={bodyStyle}>This Application uses Trackers. Essential cookies are required for the service to function (authentication, session). Non-essential cookies (analytics, advertising) are only set after you give explicit consent through the cookie banner. You can update your preferences at any time.</p>

          <h2 style={headingStyle}>Further Information for Users in the European Union</h2>
          <h3 style={subHeadingStyle}>Legal basis of processing</h3>
          <p style={bodyStyle}>The Owner may process Personal Data relating to Users if one of the following applies:</p>
          <ul style={listStyle}>
            <li>Users have given their consent for one or more specific purposes.</li>
            <li>Provision of Data is necessary for the performance of an agreement with the User and/or for any pre-contractual obligations thereof.</li>
            <li>Processing is necessary for compliance with a legal obligation to which the Owner is subject.</li>
            <li>Processing is related to a task that is carried out in the public interest or in the exercise of official authority vested in the Owner.</li>
            <li>Processing is necessary for the purposes of the legitimate interests pursued by the Owner or by a third party.</li>
          </ul>
          <p style={bodyStyle}>In any case, the Owner will gladly help to clarify the specific legal basis that applies to the processing, and in particular whether the provision of Personal Data is a statutory or contractual requirement, or a requirement necessary to enter into a contract.</p>

          <h3 style={subHeadingStyle}>Further information about retention time</h3>
          <p style={bodyStyle}>Unless specified otherwise in this document, Personal Data shall be processed and stored for as long as required by the purpose they have been collected for and may be retained for longer due to applicable legal obligation or based on the Users' consent. Therefore:</p>
          <ul style={listStyle}>
            <li>Personal Data collected for purposes related to the performance of a contract between the Owner and the User shall be retained until such contract has been fully performed.</li>
            <li>Personal Data collected for the purposes of the Owner's legitimate interests shall be retained as long as needed to fulfill such purposes.</li>
            <li>The Owner may be allowed to retain Personal Data for a longer period whenever the User has given consent to such processing, as long as such consent is not withdrawn.</li>
          </ul>
          <p style={bodyStyle}>Once the retention period expires, Personal Data shall be deleted. Therefore, the right of access, the right to erasure, the right to rectification and the right to data portability cannot be enforced after expiration of the retention period.</p>

          <h3 style={subHeadingStyle}>The rights of Users based on the General Data Protection Regulation (GDPR)</h3>
          <p style={bodyStyle}>Users may exercise certain rights regarding their Data processed by the Owner. In particular, Users have the right to do the following, to the extent permitted by law:</p>
          <ul style={listStyle}>
            <li><strong>Withdraw their consent at any time.</strong> Users have the right to withdraw consent where they have previously given their consent to the processing of their Personal Data.</li>
            <li><strong>Object to processing of their Data.</strong> Users have the right to object to the processing of their Data if the processing is carried out on a legal basis other than consent.</li>
            <li><strong>Access their Data.</strong> Users have the right to learn if Data is being processed by the Owner, obtain disclosure regarding certain aspects of the processing and obtain a copy of the Data undergoing processing.</li>
            <li><strong>Verify and seek rectification.</strong> Users have the right to verify the accuracy of their Data and ask for it to be updated or corrected.</li>
            <li><strong>Restrict the processing of their Data.</strong> The Owner will not process their Data for any purpose other than storing it.</li>
            <li><strong>Have their Personal Data deleted or otherwise removed.</strong> Users have the right to obtain the erasure of their Data from the Owner.</li>
            <li><strong>Receive their Data and have it transferred to another controller.</strong> Users have the right to receive their Data in a structured, commonly used and machine readable format.</li>
            <li><strong>Lodge a complaint.</strong> Users have the right to bring a claim before their competent data protection authority.</li>
          </ul>

          <h3 style={subHeadingStyle}>Details about the right to object to processing</h3>
          <p style={bodyStyle}>Where Personal Data is processed for a public interest, in the exercise of an official authority vested in the Owner or for the purposes of the legitimate interests pursued by the Owner, Users may object to such processing by providing a ground related to their particular situation to justify the objection.</p>
          <p style={bodyStyle}>Users must know that, however, should their Personal Data be processed for direct marketing purposes, they can object to that processing at any time, free of charge and without providing any justification.</p>

          <h3 style={subHeadingStyle}>How to exercise these rights</h3>
          <p style={bodyStyle}>Any requests to exercise User rights can be directed to the Owner through the contact details provided in this document. Such requests are free of charge and will be answered by the Owner as early as possible and always within one month.</p>

          <h2 style={headingStyle}>Further information for Users in Switzerland</h2>
          <p style={bodyStyle}>This section applies to Users in Switzerland, and, for such Users, supersedes any other possibly divergent or conflicting information contained in the privacy policy.</p>
          <h3 style={subHeadingStyle}>The rights of Users according to the Swiss Federal Act on Data Protection</h3>
          <ul style={listStyle}>
            <li>Right of access to Personal Data</li>
            <li>Right to object to the processing of their Personal Data</li>
            <li>Right to receive their Personal Data and have it transferred to another controller (data portability)</li>
            <li>Right to ask for incorrect Personal Data to be corrected</li>
          </ul>

          <h2 style={headingStyle}>Further information for Users in the United States</h2>
          <p style={bodyStyle}>This part of the document integrates with and supplements the information contained in the rest of the privacy policy. The information contained in this section applies to all Users who are residents in the following states: California, Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Nevada, Delaware, Iowa, New Hampshire, New Jersey, Nebraska, Tennessee, Minnesota, Maryland, Indiana, Kentucky, Rhode Island and Montana.</p>
          <h3 style={subHeadingStyle}>Notice at collection</h3>
          <ul style={listStyle}>
            <li>Identifiers: Usage data; Trackers; First name (+2)</li>
            <li>Internet or other electronic network activity information: Usage data; Trackers (+3)</li>
            <li>Commercial information: Trackers; Usage data; First name; Last name (+1)</li>
          </ul>
          <h3 style={subHeadingStyle}>Your privacy rights under US state laws</h3>
          <ul style={listStyle}>
            <li>The right to access Personal Information</li>
            <li>The right to correct inaccurate Personal Information</li>
            <li>The right to request the deletion of your Personal Information</li>
            <li>The right to obtain a copy of your Personal Information</li>
            <li>The right to opt out from the Sale of your Personal Information</li>
            <li>The right to non-discrimination</li>
          </ul>
          <h3 style={subHeadingStyle}>Additional rights for Users residing in California</h3>
          <ul style={listStyle}>
            <li>The right to opt out of the Sharing of your Personal Information for cross-context behavioral advertising</li>
            <li>The right to request to limit our use or disclosure of your Sensitive Personal Information</li>
          </ul>
          <h3 style={subHeadingStyle}>How to exercise your privacy rights under US state laws</h3>
          <p style={bodyStyle}>To exercise the rights described above, you need to submit your request to us by contacting us via the contact details provided in this document. For us to respond to your request, we must know who you are.</p>

          <h2 style={headingStyle}>Additional information about Data collection and processing</h2>
          <h3 style={subHeadingStyle}>Legal action</h3>
          <p style={bodyStyle}>The User's Personal Data may be used for legal purposes by the Owner in Court or in the stages leading to possible legal action arising from improper use of this Application or the related Services.</p>
          <h3 style={subHeadingStyle}>System logs and maintenance</h3>
          <p style={bodyStyle}>For operation and maintenance purposes, this Application and any third-party services may collect files that record interaction with this Application (System logs) or use other Personal Data (such as the IP Address) for this purpose.</p>
          <h3 style={subHeadingStyle}>Changes to this privacy policy</h3>
          <p style={bodyStyle}>The Owner reserves the right to make changes to this privacy policy at any time by notifying its Users on this page. Should the changes affect processing activities performed on the basis of the User's consent, the Owner shall collect new consent from the User, where required.</p>

          <h2 style={headingStyle}>Definitions and legal references</h2>
          <h3 style={subHeadingStyle}>Personal Data (or Data) / Personal Information</h3>
          <p style={bodyStyle}>Any information that directly, indirectly, or in connection with other information — including a personal identification number — allows for the identification or identifiability of a natural person.</p>
          <h3 style={subHeadingStyle}>Sensitive Personal Information</h3>
          <p style={bodyStyle}>Sensitive Personal Information means any Personal Information that is not publicly available and reveals information considered sensitive according to the applicable privacy law.</p>
          <h3 style={subHeadingStyle}>Usage Data</h3>
          <p style={bodyStyle}>Information collected automatically through this Application (or third-party services), which can include: IP addresses, URI addresses, the time of the request, features of the browser and the operating system utilized by the User, and other parameters about the device and User's IT environment.</p>
          <h3 style={subHeadingStyle}>User</h3>
          <p style={bodyStyle}>The individual using this Application who, unless otherwise specified, coincides with the Data Subject.</p>
          <h3 style={subHeadingStyle}>Data Subject</h3>
          <p style={bodyStyle}>The natural person to whom the Personal Data refers.</p>
          <h3 style={subHeadingStyle}>Data Processor (or Processor)</h3>
          <p style={bodyStyle}>The natural or legal person, public authority, agency or other body which processes Personal Data on behalf of the Controller.</p>
          <h3 style={subHeadingStyle}>Data Controller (or Owner)</h3>
          <p style={bodyStyle}>The natural or legal person which, alone or jointly with others, determines the purposes and means of the processing of Personal Data. The Data Controller, unless otherwise specified, is the Owner of this Application.</p>
          <h3 style={subHeadingStyle}>Cookie</h3>
          <p style={bodyStyle}>Cookies are Trackers consisting of small sets of data stored in the User's browser.</p>
          <h3 style={subHeadingStyle}>Tracker</h3>
          <p style={bodyStyle}>Tracker indicates any technology (e.g. Cookies, unique identifiers, web beacons, embedded scripts, e-tags and fingerprinting) that enables the tracking of Users.</p>

          <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, paddingTop: 24, marginTop: 40, fontSize: 13, color: marketingColors.softText, lineHeight: 1.7 }}>
            RinVita Ltd · Unit A435, 4-6 Greatorex Street, London E1 5NF, United Kingdom<br />
            Company registration number: 17163153 · ICO registration number: ZC123014<br />
            Owner contact email: <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a><br />
            <span style={{ fontStyle: "italic" }}>Last updated: 8 May 2026 (interim version, pending solicitor review)</span>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
};

export default PrivacyPage;
