import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/marketing/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Orbit handles personal data in this SaaS template.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      description="What data we collect, what we use it for, and how you can exercise your rights."
      updated="October 27, 2026"
    >
      <section>
        <h2 id="responsable">1. Data controller</h2>
        <p>
          The data controller is the organization that operates this Service. For privacy matters you
          can write to{" "}
          <a href="mailto:privacy@orbit.example">privacy@orbit.example</a>. This template
          must replace these details with your company&apos;s before publishing.
        </p>
      </section>

      <section>
        <h2 id="datos">2. Data we collect</h2>
        <ul>
          <li>Account data: username, email address, and encrypted credentials.</li>
          <li>Usage data: actions within the dashboard, IP address, and technical logs.</li>
          <li>Billing data: plan, subscription status, and Paddle identifiers.</li>
          <li>Communications: messages you send us through support or contact.</li>
        </ul>
        <p>
          We do not store full card numbers. Paddle processes payment data as
          Merchant of Record.
        </p>
      </section>

      <section>
        <h2 id="finalidad">3. What we use it for</h2>
        <ul>
          <li>Provide the Service, authenticate accounts, and manage subscriptions.</li>
          <li>Send transactional emails for verification, security, and billing.</li>
          <li>Detect abuse, prevent fraud, and keep the platform secure.</li>
          <li>Improve the product using aggregated, non-identifiable data.</li>
          <li>Comply with legal and accounting obligations.</li>
        </ul>
      </section>

      <section>
        <h2 id="base-legal">4. Legal basis</h2>
        <p>
          We process the data necessary to perform our contract with you, to comply with legal
          obligations, and, where applicable, on the basis of our legitimate interest in maintaining and
          improving the Service. Any optional marketing communication will be sent only with your
          consent.
        </p>
      </section>

      <section>
        <h2 id="conservacion">5. Retention</h2>
        <p>
          We retain data while your account is active and for the period necessary to
          comply with legal obligations. Technical logs are retained for a limited time. When
          an account is deleted, personal data is erased or anonymized unless there is a legal obligation
          to retain it.
        </p>
      </section>

      <section>
        <h2 id="encargados">6. Providers and transfers</h2>
        <p>
          We rely on infrastructure, transactional email, and payment providers. Paddle acts
          as Merchant of Record and processes billing data under its own policies. Providers
          only access the data necessary to deliver the service and are subject to
          processing agreements.
        </p>
      </section>

      <section>
        <h2 id="derechos">7. Your rights</h2>
        <p>
          You can request access, rectification, erasure, restriction, portability, and objection to the
          processing of your personal data. Write to us at{" "}
          <a href="mailto:privacy@orbit.example">privacy@orbit.example</a> and we will respond within
          the applicable legal period. You can also file a complaint with the data protection
          authority in your country.
        </p>
      </section>

      <section>
        <h2 id="cookies">8. Cookies</h2>
        <p>
          We use cookies and local storage strictly necessary to maintain the session,
          remember the theme preference, and protect authentication. If we add optional
          analytics in the future, we will enable it only with consent and update this section.
        </p>
      </section>

      <section>
        <h2 id="security">9. Security</h2>
        <p>
          We apply reasonable technical and organizational measures: encryption in transit, hashed
          passwords, short-lived tokens, webhook signature verification, and restricted access
          to production environments. No system is completely infallible; if you detect an
          incident, write to us at{" "}
          <a href="mailto:security@orbit.example">security@orbit.example</a>.
        </p>
      </section>

      <section>
        <h2 id="contact">10. Changes and contact</h2>
        <p>
          We may update this policy to reflect changes in the Service or the law. The
          date of the last revision appears at the top. See also our{" "}
          <Link href="/terms">terms of service</Link>.
        </p>
      </section>
    </LegalDoc>
  );
}
