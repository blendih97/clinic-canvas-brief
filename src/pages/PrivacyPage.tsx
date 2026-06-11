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
  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    margin: "12px 0 20px",
    fontSize: 14,
    color: marketingColors.mutedText,
    fontWeight: 300,
  };
  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 12px",
    background: marketingColors.goldSoft,
    border: `1px solid ${marketingColors.goldBorder}`,
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    color: marketingColors.ink,
    fontSize: 14.5,
  };
  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    border: `1px solid ${marketingColors.goldBorder}`,
    verticalAlign: "top",
    lineHeight: 1.7,
  };

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <SEO title="Privacy Policy — RinVita" description="How Rinvita Ltd collects, processes, and protects your personal and special category (medical) data. UK GDPR, ICO registered." path="/privacy" />
      <MarketingStyles />
      <MarketingNav currentPage="home" />
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 56 : 80}px`, background: marketingColors.cream }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span className="marketing-section-label">Legal</span>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : 56, fontWeight: 300, color: marketingColors.ink, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: marketingColors.softText, letterSpacing: "0.04em", marginBottom: 28 }}>
            Rinvita Ltd — policy version: 28 May 2026
          </p>

          <h2 style={headingStyle}>1. Introduction</h2>
          <p style={bodyStyle}>
            This Privacy Policy is provided by Rinvita Ltd, a company registered in England and Wales under company number 17163153 with registered office Unit A435, 4–6 Greatorex Street, London, England, E1 5NF ("we", "our" or "us") for use of our products and services including our platform (the "Services").
          </p>
          <p style={bodyStyle}>
            We take your privacy very seriously. Please read this privacy policy carefully as it contains important information on how and why we collect, store, use and share any information relating to you (your <strong>personal data</strong>).
          </p>
          <p style={bodyStyle}>
            It also explains your rights in relation to your personal data and how to contact us or the relevant regulator in the event you have a complaint. Our collection, storage, use and sharing of your personal data is regulated by law, including under the UK General Data Protection Regulation (<strong>UK GDPR</strong>).
          </p>
          <p style={bodyStyle}>
            We are the controller of personal data obtained via the Services, meaning we are the organisation legally responsible for deciding how and for what purposes it is used.
          </p>

          <h2 style={headingStyle}>2. What this policy applies to</h2>
          <p style={bodyStyle}>This privacy policy relates to your use of the Services only.</p>
          <p style={bodyStyle}>
            The Services may link to or rely on other apps, websites, APIs or services owned and operated by us or by certain trusted third parties to enable us to provide you with Services. These other apps, websites, APIs or services may also gather information about you in accordance with their own separate privacy policies. For privacy information relating to these other apps, websites or services, please consult their privacy policies as appropriate. For more information see the section "Who we share your personal data with" below.
          </p>

          <h2 style={headingStyle}>3. Personal data we collect about you</h2>
          <p style={bodyStyle}>
            The personal data we collect about you depends on the particular activities carried out through the Services. We will collect and use the following personal data about you:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Category of data</th><th style={thStyle}>In more detail</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Identity and account data you input into the Services. Registration is mandatory in order to use the Services.</td>
                <td style={tdStyle}>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Your name and email address</li>
                    <li>Your phone number</li>
                    <li>Credit card and payment information</li>
                    <li>Your account details, such as username and password</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>Data collected when you use specific functions in the Services</td>
                <td style={tdStyle}>Data you store online with us using the Services including your usage history or preferences (while such data may not always be personal data as defined at law in all cases, we will assume it is and treat it in accordance with this policy as if it were).</td>
              </tr>
              <tr>
                <td style={tdStyle}>Other data the Services collect automatically when you use them</td>
                <td style={tdStyle}>Your activities on, and use of, the Services which reveal your preferences, interests or manner of use of the Services and the times of use. Your device type, IMEI numbers, MAC address of networks, other unique device identification, device operating system, mobile network information, app version number, storage usage, data usage, time zone settings.</td>
              </tr>
            </tbody>
          </table>
          <p style={bodyStyle}>If you do not provide personal data we ask for where it is required, it may prevent us from providing services and/or the Services to you.</p>
          <p style={bodyStyle}>We collect and use this personal data for the purposes described in the section "How and why we use your personal data" below.</p>

          <h2 style={headingStyle}>4. Personal information of minors</h2>
          <p style={bodyStyle}>
            If we collect personal data from individuals under the age of 18 directly, we will assess their capacity to consent on a case-by-case basis. As a general principle, an individual under the age of 18 may have the capacity to consent if they demonstrate sufficient maturity to understand the nature and consequences of what is being proposed. Where it is determined that the individual does not have such capacity, we will seek verifiable consent from a parent or guardian.
          </p>
          <p style={bodyStyle}>
            If it is not practicable to assess capacity on a case-by-case basis, we will generally assume that individuals aged 13 and above have the capacity to provide consent, unless there are reasonable grounds to believe otherwise. Parents or guardians may contact us using the details set out below to review, manage, or request deletion of their child's personal information.
          </p>

          <h2 style={headingStyle}>5. Special category personal data or sensitive data</h2>
          <p style={bodyStyle}>
            Certain personal data we collect is treated as a "special category" to which additional protections apply under data protection law. This is also known as "Sensitive Data". Where we process such Sensitive Data, we will also ensure we are permitted to do so under data protection laws, and any such data will be collected on the basis of your explicit consent. Sensitive Data we collect about you, where you choose to give it to us, may include:
          </p>
          <ul style={listStyle}>
            <li>Medical history and medical information, including past surgeries, past treatments</li>
            <li>Existing conditions: allergies, chronic pains, chronic illnesses, ongoing treatments such as current medications consumed</li>
            <li>Records and details of prescriptions given and/or refused</li>
            <li>Past consultations; dates, the doctor providing treatment and the concern</li>
            <li>Weight, height, age</li>
            <li>Your gender and sex — if you choose to give this to us</li>
            <li>Lifestyle details</li>
            <li>Past and present use of cannabis (if any)</li>
            <li>History of drug consumption, medical or recreational</li>
          </ul>
          <p style={bodyStyle}>If you do not provide personal data we ask for where it is asked, it may prevent us from providing the Services.</p>
          <p style={bodyStyle}>We collect and use this personal data for the purposes described in the section "How and why we use your personal data" below.</p>

          <h2 style={headingStyle}>6. How your personal data is collected</h2>
          <p style={bodyStyle}>We collect personal data from you:</p>
          <ul style={listStyle}>
            <li>directly, when you enter or send us information, such as when you register with us, contact us (including via email), send us feedback, purchase or request services via our Services, post material to our platform and complete patient surveys; and</li>
            <li>indirectly, such as your browsing activity while using the Services.</li>
          </ul>
          <p style={bodyStyle}>At this point in time, we may collect personal information about you using cookies or similar technologies. Detailed information regarding our use of cookies and similar technologies is made available in the relevant cookies policy.</p>

          <h2 style={headingStyle}>7. How and why we use your personal data</h2>
          <p style={bodyStyle}>Under data protection law, we can only use your personal data if we have a proper reason, e.g.:</p>
          <ul style={listStyle}>
            <li>where you have given consent;</li>
            <li>to comply with our legal and regulatory obligations;</li>
            <li>for the performance of a contract with you or to take steps at your request before entering into a contract; or</li>
            <li>for our legitimate interests or those of a third party.</li>
          </ul>
          <p style={bodyStyle}>
            A legitimate interest is when we have a business or commercial reason to use your information, so long as this is not overridden by your own rights and interests. We will carry out an assessment when relying on legitimate interests, to balance our interests against your own. You can obtain details of this assessment by contacting us (see "How to contact us" below).
          </p>
          <p style={bodyStyle}>The table below explains what we use your personal data for and why.</p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>What we use your personal data for</th><th style={thStyle}>Our reasons</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Create and manage your account and patient file with us</td>
                <td style={tdStyle}>For our legitimate interests, i.e. to be as efficient as we can so we can deliver the best service to you. To perform our contract with you or to take steps at your request before entering into a contract.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Providing services and/or the functionalities of the Services to you</td>
                <td style={tdStyle}>To perform our contract with you or to take steps at your request before entering into a contract.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Conducting checks to identify you and verify your identity or to help prevent and detect fraud against you or us</td>
                <td style={tdStyle}>To comply with our legal and regulatory obligations. For our legitimate interests, i.e. to minimise fraud that could be damaging for you and/or us.</td>
              </tr>
              <tr>
                <td style={tdStyle}>To enforce legal rights or defend or undertake legal proceedings</td>
                <td style={tdStyle}>Depending on the circumstances: to comply with our legal and regulatory obligations; in other cases, for our legitimate interests or those of a third party, i.e. to protect our business, interests and rights or those of others.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Communications with you not related to marketing, including about changes to our terms or policies or changes to the Services or other important notices</td>
                <td style={tdStyle}>Depending on the circumstances: to comply with our legal and regulatory obligations; in other cases, for our legitimate interests or those of a third party, i.e. to provide the best service to you.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Protect the security of systems and data</td>
                <td style={tdStyle}>To comply with our legal and regulatory obligations. We may also use your personal data to ensure the security of systems and data to a standard that goes beyond our legal obligations, and in those cases our reasons are for our legitimate interests or those of a third party, i.e. to protect systems and data and to prevent and detect criminal activity that could be damaging for you and/or us.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Operational reasons, such as improving efficiency, training, and quality control or to provide support to you</td>
                <td style={tdStyle}>For our legitimate interests or those of a third party, i.e. to be as efficient as we can so we can deliver the best service to you.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Statistical analysis to help us manage our business, e.g. in relation to our performance, customer base, platform and functionalities and offerings or other efficiency measures</td>
                <td style={tdStyle}>For our legitimate interests or those of a third party, i.e. to be as efficient as we can so we can deliver the best service to you and improve and develop our platform.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Updating and enhancing patient records</td>
                <td style={tdStyle}>Depending on the circumstances: to perform our contract with you or to take steps at your request before entering into a contract; to comply with our legal and regulatory obligations; or, where neither of the above apply, for our legitimate interests or those of a third party, e.g. making sure that we can keep in touch with our customers about their accounts and new products or functionalities related to the Services and our services.</td>
              </tr>
              <tr>
                <td style={tdStyle}>Disclosures and other activities necessary to comply with legal and regulatory obligations that apply to our business</td>
                <td style={tdStyle}>To comply with our legal and regulatory obligations.</td>
              </tr>
              <tr>
                <td style={tdStyle}>The audit of our accounts and business</td>
                <td style={tdStyle}>For our legitimate interests, i.e. to maintain any accreditations so we can demonstrate we operate at the highest standards.</td>
              </tr>
              <tr>
                <td style={tdStyle}>To share your personal data with members of our group and third parties in connection with a significant corporate transaction or restructuring, including a merger, acquisition, asset sale, initial public offering or in the event of our insolvency. In such cases information will be anonymised where possible and only shared where necessary.</td>
                <td style={tdStyle}>Depending on the circumstances: to comply with our legal and regulatory obligations; in other cases, for our legitimate interests or those of a third party, i.e. to protect, realise or grow the value in our business and assets.</td>
              </tr>
            </tbody>
          </table>
          <p style={bodyStyle}>See "Who we share your personal data with" for further information on the steps we will take to protect your personal data where we need to share it with others.</p>

          <h2 style={headingStyle}>8. Who we share your personal data with</h2>
          <p style={bodyStyle}>We routinely share personal data with service providers we use to help us run our business or provide the services or functionalities in the Services, including:</p>
          <ul style={listStyle}>
            <li>third parties we use to help deliver our services to you, e.g. third party service providers (such as website developers or payment providers, or providers of security infrastructure);</li>
            <li>other third parties we use to help us run our business, e.g. platform hosts and platform analytics providers; and</li>
            <li>freelance doctors and other medical staff or contractors assisting us in providing their services to you.</li>
          </ul>
          <p style={bodyStyle}>The third party processors we currently use are set out in the table below:</p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Processor</th><th style={thStyle}>Purpose</th><th style={thStyle}>Terms</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Supabase</td><td style={tdStyle}>Database hosting and backend infrastructure</td><td style={tdStyle}><a href="https://supabase.com/privacy" style={{ color: marketingColors.gold }}>supabase.com/privacy</a></td></tr>
              <tr><td style={tdStyle}>Anthropic</td><td style={tdStyle}>AI processing</td><td style={tdStyle}><a href="https://www.anthropic.com/legal/privacy" style={{ color: marketingColors.gold }}>anthropic.com/legal/privacy</a></td></tr>
              <tr><td style={tdStyle}>Resend</td><td style={tdStyle}>Transactional email delivery</td><td style={tdStyle}><a href="https://resend.com/privacy" style={{ color: marketingColors.gold }}>resend.com/privacy</a></td></tr>
              <tr><td style={tdStyle}>Stripe</td><td style={tdStyle}>Payment processing</td><td style={tdStyle}><a href="https://stripe.com/gb/privacy" style={{ color: marketingColors.gold }}>stripe.com/gb/privacy</a></td></tr>
              <tr><td style={tdStyle}>Google (OAuth)</td><td style={tdStyle}>Authentication services</td><td style={tdStyle}><a href="https://policies.google.com/privacy" style={{ color: marketingColors.gold }}>policies.google.com/privacy</a></td></tr>
            </tbody>
          </table>
          <p style={bodyStyle}>We only allow those organisations/individuals/service providers to handle your personal data if we are satisfied they take appropriate measures to protect your personal data. We also impose contractual obligations on service providers to ensure they can only use your personal data to provide services to us and to you.</p>
          <p style={bodyStyle}>We or the third parties mentioned above may occasionally also need to share your personal data with:</p>
          <ul style={listStyle}>
            <li>external auditors, e.g. in relation to the audit of our accounts and our company — the recipient of the information will be bound by confidentiality obligations;</li>
            <li>professional advisors (such as lawyers and other advisors) — the recipient of the information will be bound by confidentiality obligations;</li>
            <li>law enforcement agencies, courts or tribunals and regulatory bodies to comply with legal and regulatory obligations; and</li>
            <li>other parties in connection with a significant corporate transaction or restructuring, including a merger, acquisition, asset sale, initial public offering or in the event of our insolvency — usually, information will be anonymised but this may not always be possible; however, the recipient of the information will be bound by confidentiality obligations.</li>
          </ul>
          <p style={bodyStyle}>If you would like more information about who we share our data with and why, please contact us (see "How to contact us" below).</p>
          <p style={bodyStyle}>We will not share your personal data with any other third party.</p>

          <h2 style={headingStyle}>9. How long your personal data will be kept</h2>
          <p style={bodyStyle}>
            We will keep your personal data for as long as you have an active account with us and for a period of up to 6 years thereafter to comply with any accounting or legal obligations including in the event of the pursuit or defence of legal claims. Once you have closed your account with us, we will move your personal data to a separate database so that only key stakeholders in our business on a "need to know basis" have access to such data.
          </p>
          <p style={bodyStyle}>Following the end of the aforementioned retention period, we will delete or anonymise your personal data.</p>

          <h2 style={headingStyle}>10. Transferring your personal data out of the UK</h2>
          <p style={bodyStyle}>As part of providing the platform and Services, we may share your personal data with third parties based outside of the UK.</p>
          <p style={bodyStyle}>
            Under UK data protection laws, we can only transfer your personal data to a country outside the UK where: the UK government has decided the particular country ensures an adequate level of protection of personal data (known as an "adequacy regulation") further to Article 45 of the UK GDPR; there are appropriate safeguards in place, together with enforceable rights and effective legal remedies for you; or a specific exception applies under relevant data protection law. Accordingly, if we were to start transferring your personal data from the UK to:
          </p>
          <ul style={listStyle}>
            <li>The EEA: we would rely on the adequacy finding granted by the UK to the EU under the Withdrawal Agreement to do so; for any transfers from the EU to the UK, we would rely on the adequacy regulation granted to the UK under the Adequacy Decision.</li>
            <li>Any country located outside the UK/EEA: we would rely on appropriate safeguards under the UK GDPR, such as by relying on an Adequacy Decision being in place for that country, or entering into an International Data Transfer Agreement.</li>
          </ul>
          <p style={bodyStyle}>In the event we could not or choose not to continue to rely on either of those mechanisms at any time we would not transfer your personal data outside the UK unless we could do so on the basis of an alternative mechanism or exception provided by UK data protection law.</p>

          <h2 style={headingStyle}>11. Your rights</h2>
          <p style={bodyStyle}>
            You generally have the following rights, which you can usually exercise free of charge. For more information regarding these rights, please visit the <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/" style={{ color: marketingColors.gold }}>ICO website</a>.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Right</th><th style={thStyle}>What it means</th></tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Access to a copy of your personal data</td><td style={tdStyle}>The right to be provided with a copy of your personal data.</td></tr>
              <tr><td style={tdStyle}>Correction (also known as rectification)</td><td style={tdStyle}>The right to require us to correct any mistakes in your personal data.</td></tr>
              <tr><td style={tdStyle}>Erasure (also known as the right to be forgotten)</td><td style={tdStyle}>The right to require us to delete your personal data — in certain situations.</td></tr>
              <tr><td style={tdStyle}>Restriction of use</td><td style={tdStyle}>The right to require us to restrict use of your personal data in certain circumstances, e.g. if you contest the accuracy of the data.</td></tr>
              <tr><td style={tdStyle}>Data portability</td><td style={tdStyle}>The right to receive your personal data, which you have provided to us, in a structured, commonly used and machine-readable format and/or transmit that data to a third party — in certain situations.</td></tr>
              <tr><td style={tdStyle}>Object</td><td style={tdStyle}>The right to object to us processing your personal data (including in relation to direct marketing).</td></tr>
              <tr><td style={tdStyle}>Withdraw consent</td><td style={tdStyle}>The right to withdraw consent at any time where we are relying on consent to process your personal data.</td></tr>
            </tbody>
          </table>
          <p style={bodyStyle}>For further information on each of those rights, including the circumstances in which they do and do not apply, please contact us (see "How to contact us" below). You may also find it helpful to refer to the guidance from the UK's Information Commissioner on your rights under the UK GDPR.</p>
          <p style={bodyStyle}>If you would like to exercise any of those rights, please email, call or write to us — see below: "How to contact us". When contacting us please:</p>
          <ul style={listStyle}>
            <li>provide enough information to identify yourself (e.g. your full name and username) and any additional identity information we may reasonably request from you; and</li>
            <li>let us know which right(s) you want to exercise and the information to which your request relates.</li>
          </ul>

          <h2 style={headingStyle}>12. Keeping your personal data secure</h2>
          <p style={bodyStyle}>We have appropriate security measures to prevent personal data from being accidentally lost, or used or accessed unlawfully. We limit access to your personal data to those who have a genuine business need to access it.</p>
          <p style={bodyStyle}>We also have procedures in place to deal with any suspected data security breach. We will notify you and any applicable regulator of a suspected data security breach where we are legally required to do so.</p>
          <p style={bodyStyle}>
            If you want detailed information from Get Safe Online on how to protect your information and your computers and devices against fraud, identity theft, viruses and many other online problems, please visit <a href="https://www.getsafeonline.org" style={{ color: marketingColors.gold }}>www.getsafeonline.org</a>. Get Safe Online is supported by HM Government and leading businesses.
          </p>

          <h2 style={headingStyle}>13. How to complain</h2>
          <p style={bodyStyle}>Please contact us if you have any queries or concerns about our use of your information (see below "How to contact us"). We hope we will be able to resolve any issues you may have.</p>
          <p style={bodyStyle}>
            You also have the right to lodge a complaint with the Information Commissioner. The Information Commissioner can be contacted at <a href="https://ico.org.uk/make-a-complaint" style={{ color: marketingColors.gold }}>ico.org.uk/make-a-complaint</a> or by telephone on 0303 123 1113.
          </p>

          <h2 style={headingStyle}>14. Changes to this privacy policy</h2>
          <p style={bodyStyle}>We may change this privacy policy from time to time. When we make significant changes we will take steps to inform you, for example via the Services or by other means, such as email.</p>

          <h2 style={headingStyle}>15. How to contact us</h2>
          <p style={bodyStyle}>You can contact us by email or telephone if you have any questions about this privacy policy or the information we hold about you, to exercise a right under data protection law or to make a complaint.</p>
          <p style={bodyStyle}>Our contact details are:</p>
          <p style={bodyStyle}>
            Rinvita Ltd<br />
            Unit A435, 4–6 Greatorex Street<br />
            London, E1 5NF, United Kingdom<br />
            Company registration number: 17163153<br />
            ICO registration number: ZC123014<br />
            Email: <a href="mailto:hello@rinvita.co.uk" style={{ color: marketingColors.gold }}>hello@rinvita.co.uk</a><br />
            Telephone: +44 7957 229692
          </p>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
};

export default PrivacyPage;
