import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/marketing/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Sample terms for a SaaS product built on the Orbit template.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      description="The basic rules for using the product, managing your account, and understanding how the plans work."
      updated="October 27, 2026"
    >
      <section>
        <h2 id="objeto">1. Scope</h2>
        <p>
          These terms govern access to and use of the platform offered under the Orbit brand
          (hereinafter, “the Service”). By creating an account or using the Service you accept these
          conditions. If you act on behalf of an organization, you represent that you are authorized
          to bind it.
        </p>
      </section>

      <section>
        <h2 id="cuentas">2. Accounts and access</h2>
        <p>
          You must provide accurate information and keep your credentials confidential.
          Each account is personal and non-transferable. Notify us promptly of any unauthorized
          access. We may suspend accounts that breach these conditions or that pose a
          risk to the Service or to others.
        </p>
      </section>

      <section>
        <h2 id="plans">3. Plans, payments, and renewals</h2>
        <p>
          Plans, limits, and prices are shown on the pricing page and at checkout.
          Payments are processed through Paddle as Merchant of Record, which calculates and manages the
          applicable taxes. Subscriptions renew automatically until you
          cancel them.
        </p>
        <p>
          You can cancel at any time. Cancellation takes effect at the end of the billed
          period and you keep access until that date. Unless the law requires otherwise,
          amounts already paid are non-refundable.
        </p>
      </section>

      <section>
        <h2 id="uso">4. Acceptable use</h2>
        <p>You may not:</p>
        <ul>
          <li>Use the Service for unlawful activities or to infringe the rights of third parties.</li>
          <li>Attempt to access data, accounts, or systems without authorization.</li>
          <li>Interfere with the availability, integrity, or security of the Service.</li>
          <li>Resell or sublicense the Service without a written agreement.</li>
          <li>Automate mass data extraction outside the public API.</li>
        </ul>
      </section>

      <section>
        <h2 id="propiedad">5. Intellectual property</h2>
        <p>
          The Service, its interface, and its documentation are protected by intellectual
          property rights. The code template is distributed under the license included in the
          repository; the content, brand, and data you add remain yours.
        </p>
      </section>

      <section>
        <h2 id="license">6. Template license</h2>
        <p>
          The template is provided “as is” so you can adapt it to your product. You may
          modify and deploy it for your project. You may not redistribute it as a competing
          template or remove applicable license notices.
        </p>
      </section>

      <section>
        <h2 id="disponibilidad">7. Availability and changes</h2>
        <p>
          We work to keep the Service available, but we do not guarantee uninterrupted
          availability. We may release updates, change features, or remove
          components with reasonable notice when the change is material. The Scale plan may include
          a specific service level agreement.
        </p>
      </section>

      <section>
        <h2 id="responsabilidad">8. Limitation of liability</h2>
        <p>
          To the extent permitted by law, we are not liable for indirect damages, loss of
          profits, or loss of data arising from use of the Service. Our total
          liability is limited to the amount paid in the twelve months preceding the event giving rise to the
          claim.
        </p>
      </section>

      <section>
        <h2 id="contact">9. Contact</h2>
        <p>
          For any questions about these terms, write to{" "}
          <a href="mailto:legal@orbit.example">legal@orbit.example</a>. See also our{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </LegalDoc>
  );
}
