const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Creativo's services, you accept and agree to be 
                bound by the terms and provision of this agreement. If you do not agree to abide by 
                the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Creativo provides a white-label design platform for agencies, offering 
                unlimited design services, project management tools, and comprehensive business solutions. 
                We reserve the right to modify or discontinue services at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>To access our services, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Be at least 18 years old or have legal guardian consent</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Payment terms and conditions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All fees are due in advance unless otherwise specified</li>
                  <li>Subscription fees are billed monthly or annually</li>
                  <li>No refunds for partial months of service</li>
                  <li>Price changes will be communicated 30 days in advance</li>
                  <li>Late payments may result in service suspension</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All content, features, and functionality of our service are owned by Creativo 
                  and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>Design deliverables created for clients become the property of the client upon full payment.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the service for illegal or unauthorized purposes</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious code or viruses</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Share account credentials with third parties</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
              <p className="text-muted-foreground">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. 
                Scheduled maintenance will be communicated in advance when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Creativo be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including lost profits, arising from 
                your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We may terminate or suspend your account immediately if you:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Breach these terms of service</li>
                  <li>Fail to pay required fees</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Violate applicable laws</li>
                </ul>
                <p>You may terminate your account at any time by contacting support.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms shall be governed by and construed in accordance with the laws of 
                California, United States, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting. Continued use of the service constitutes acceptance of 
                the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <div className="text-muted-foreground">
                <p>For questions about these terms, contact us:</p>
                <ul className="mt-4 space-y-2">
                  <li>Email: Support@terrixcreativestud.io</li>
                  <li>Phone: (725) 224-7202</li>
                  <li>Address: San Francisco, CA</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;