const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: July 2026</p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="font-medium text-foreground">Personal Information You Provide</p>
                <p>We collect personal information that you voluntarily provide to us when you register, use our services, or contact us. This includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full names</li>
                  <li>Phone numbers</li>
                  <li>Email addresses</li>
                  <li>Usernames and passwords</li>
                  <li>Contact or communication preferences</li>
                  <li>Debit and credit card numbers</li>
                  <li>Mailing and billing addresses</li>
                  <li>Authentication data</li>
                  <li>Financial data and, where required and with consent, Social Security numbers or government-issued identifiers</li>
                  <li>Social media login information (where applicable)</li>
                </ul>

                <p className="font-medium text-foreground mt-6">Information Collected Automatically</p>
                <p>When you access or use our platform, we automatically collect certain technical information, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP address</li>
                  <li>Browser type and characteristics</li>
                  <li>Device characteristics and name</li>
                  <li>Operating system</li>
                  <li>Language preferences</li>
                  <li>Referring URLs</li>
                  <li>Country and general location data</li>
                  <li>Usage patterns and interactions with the platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account creation and authentication</li>
                  <li>Delivery of our services and ongoing user support</li>
                  <li>Order fulfillment and transaction processing</li>
                  <li>Facilitating user-to-user communications on the platform</li>
                  <li>Fraud prevention, security monitoring, and abuse detection</li>
                  <li>Analysis of usage trends to improve our platform</li>
                  <li>Compliance with applicable legal and regulatory obligations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Data Sharing</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">We do not sell your personal information.</strong> We may share your information only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">Business transfers:</strong> In connection with a merger, acquisition, sale of assets, financing, or other business transaction, your information may be transferred as part of that transaction.
                  </li>
                  <li>
                    <strong className="text-foreground">Legal requirements:</strong> We may disclose information where required by law, subpoena, court order, or other governmental or regulatory authority.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services, fulfill the purposes outlined in this Privacy Policy, and comply with applicable legal, tax, and regulatory requirements. When information is no longer needed, we securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures designed to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our platform is intended for users who are at least 18 years of age. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that an account belongs to a user under 18, we will deactivate that account and promptly delete all associated personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Depending on your location, you may have certain rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Withdraw consent at any time by contacting us via email</li>
                  <li>Review, update, or correct your account information through your account settings</li>
                  <li>Request deletion of your personal data</li>
                  <li>Terminate your account at any time through account settings</li>
                  <li>Contact us directly at <a href="mailto:support@cretivo.io" className="text-orange-400 hover:text-orange-300">support@cretivo.io</a> to request access to, correction of, or deletion of your personal information</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <div className="text-muted-foreground">
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please contact us:</p>
                <ul className="mt-4 space-y-2">
                  <li>Email: <a href="mailto:support@cretivo.io" className="text-orange-400 hover:text-orange-300">support@cretivo.io</a></li>
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

export default PrivacyPolicy;
