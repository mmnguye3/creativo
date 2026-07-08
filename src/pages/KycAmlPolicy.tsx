const KycAmlPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">KYC &amp; AML Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: July 2026</p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Our Commitment</h2>
              <p className="text-muted-foreground">
                Cretivo is committed to full compliance with applicable anti-money laundering (AML) and know-your-customer (KYC) requirements, including the <strong className="text-foreground">Bank Secrecy Act (BSA)</strong>, the <strong className="text-foreground">USA PATRIOT Act</strong>, and guidance issued by the <strong className="text-foreground">Financial Crimes Enforcement Network (FinCEN)</strong>. We maintain a risk-based compliance program designed to detect and prevent financial crimes, money laundering, terrorist financing, and other illicit activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Scope</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>This policy applies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All users engaged in financial transactions on the Platform</li>
                  <li>Users involved in payment processing, digital marketplace purchases, or coin-based systems</li>
                  <li>All Cretivo employees, contractors, and agents involved in compliance or financial operations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Identity Verification Requirements</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Prior to enabling financial activity on the Platform, we may require users to provide the following:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full legal name</li>
                  <li>Date of birth</li>
                  <li>Physical address (no P.O. boxes)</li>
                  <li>Government-issued photo identification (passport, driver's license, national ID)</li>
                  <li>Selfie or biometric verification, where applicable</li>
                </ul>
                <p className="mt-2">All submitted identity documents are verified through our compliance process. Cretivo reserves the right to request additional documentation at any time.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Enhanced Due Diligence</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Users identified as higher risk may be subject to Enhanced Due Diligence (EDD), which may include requests for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proof of address (utility bill, bank statement dated within 90 days)</li>
                  <li>Documentation of source of funds</li>
                  <li>Occupation and employer information</li>
                  <li>Additional identity verification steps</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Verification Process</h2>
              <p className="text-muted-foreground">
                Identity verification is conducted through NIST-compliant third-party identity verification partners. Where automated verification is inconclusive, a trained compliance team member will conduct manual review. Cretivo reserves the right to delay, restrict, or terminate access to financial features pending satisfactory verification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Risk Factors</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Our compliance program uses a risk-based approach. Risk factors that may trigger enhanced review or monitoring include, but are not limited to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Geographic jurisdiction (high-risk countries or sanctioned regions)</li>
                  <li>Unusually high transaction volume or frequency relative to account history</li>
                  <li>Use of virtual currency types associated with elevated anonymity risks</li>
                  <li>Behavioral patterns such as repeated failed KYC attempts or rapid high-value deposits followed by immediate withdrawal</li>
                  <li>Inconsistencies between stated purpose and observed account activity</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Transaction Monitoring &amp; Red Flags</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We monitor transactions on an ongoing basis. The following are examples of red flags that may prompt review or reporting:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transactions of unusual size or frequency inconsistent with stated business purpose</li>
                  <li>Multiple accounts associated with substantially similar identity data</li>
                  <li>Use of VPNs, anonymizing proxies, or Tor to obscure geographic location</li>
                  <li>Rapid withdrawal of funds shortly after a large deposit</li>
                  <li>Structuring of transactions to avoid reporting thresholds</li>
                  <li>Activity inconsistent with the user's stated occupation or business</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Suspicious Activity Reporting</h2>
              <p className="text-muted-foreground">
                Where we identify activity that we reasonably suspect may constitute money laundering, terrorist financing, or other financial crime, we will file a Suspicious Activity Report (SAR) with FinCEN as required by law. All SAR filings are strictly confidential. We are prohibited by law from disclosing to the subject of a SAR that a report has been made.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Recordkeeping</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We maintain the following records for a minimum of <strong className="text-foreground">five (5) years</strong> in encrypted, access-controlled storage:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>KYC documentation and verification records</li>
                  <li>Transaction histories and supporting data</li>
                  <li>Compliance communications and case notes</li>
                  <li>Suspicious Activity Reports (SARs) and related documentation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Law Enforcement Cooperation</h2>
              <p className="text-muted-foreground">
                Cretivo will fully cooperate with lawful requests from U.S. law enforcement agencies, regulatory bodies, and courts, including producing records, providing testimony, or taking other actions required by applicable law or legal process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
              <div className="text-muted-foreground">
                <p>For questions or concerns related to this KYC &amp; AML Policy, please contact our compliance team:</p>
                <ul className="mt-4 space-y-2">
                  <li>Email: <a href="mailto:compliance@cretivo.io" className="text-orange-400 hover:text-orange-300">compliance@cretivo.io</a></li>
                  <li>Website: <a href="https://www.cretivo.io" className="text-orange-400 hover:text-orange-300">www.cretivo.io</a></li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycAmlPolicy;
