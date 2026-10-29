export const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Pricing", href: "/pricing" },
      { label: "Documentation", href: "/docs" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Quickstart", href: "/docs#quickstart" },
      { label: "API", href: "/docs#api" },
      { label: "Webhooks", href: "/docs#webhooks" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/privacy#cookies" },
      { label: "License", href: "/terms#license" },
    ],
  },
  {
    title: "Template",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin panel", href: "/admin" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export const logos = [
  { name: "Norte", className: "font-display text-2xl font-semibold tracking-[-0.06em]" },
  { name: "MAREA", className: "text-sm font-semibold tracking-[0.28em]" },
  { name: "kappa.", className: "font-display text-2xl font-medium tracking-[-0.04em]" },
  { name: "Faro", className: "font-serif text-2xl font-semibold italic tracking-tight" },
  { name: "trebo", className: "text-xl font-semibold lowercase tracking-[-0.08em]" },
  { name: "Luma", className: "font-display text-2xl font-semibold tracking-[-0.05em]" },
];

export const testimonials = [
  {
    quote:
      "We used to open five tabs to see how the week was going. Now we open Orbit and the meeting starts with data, not guesses.",
    name: "Lucía Ferrer",
    role: "COO at Norte",
    initials: "LF",
    metric: "32% less time on reports",
    accent: "bg-primary",
  },
  {
    quote:
      "The alerts inbox changed our shift. We reach the problem before the customer writes in.",
    name: "Mateo Salas",
    role: "Head of Support at Marea",
    initials: "MS",
    metric: "18 min average response time",
    accent: "bg-accent",
  },
  {
    quote:
      "We set up the dashboard in an afternoon and adapted it to our workflow without touching a single line of backend code.",
    name: "Inés Rojas",
    role: "Founder of Faro",
    initials: "IR",
    metric: "1 afternoon to set up",
    accent: "bg-admin",
  },
];

export const faqs = [
  {
    question: "Is Orbit a real product or a template?",
    answer:
      "Orbit is the demo brand for this SaaS template. The code is yours: change the name, palette, and copy to launch your own product without starting from scratch.",
  },
  {
    question: "What exactly is included?",
    answer:
      "Next.js 14 with the App Router, Tailwind, accessible components, email verification and OTP authentication, Paddle plans, a dashboard, and an admin panel. The full FastAPI backend lives in the same repository.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Paddle acts as the Merchant of Record. Checkout opens hosted by Paddle and the subscription syncs through webhooks. In sandbox you can walk through the whole flow without charging for real.",
  },
  {
    question: "Can I change prices and plans?",
    answer:
      "Yes. The catalog lives in your database and is managed from the admin panel. The landing page consumes GET /billing/plans and the monthly/yearly selector filters by billing_period.",
  },
  {
    question: "Does it work with a keyboard and in dark mode?",
    answer:
      "Yes. The interface uses semantic tokens, visible focus, AA contrast, and respects prefers-reduced-motion. Interactive components are built on Radix UI.",
  },
  {
    question: "Is there a minimum term or contract?",
    answer:
      "No. You can cancel whenever you want and keep access until the end of the billed period. The Free plan does not require a card.",
  },
  {
    question: "What do I need to deploy?",
    answer:
      "Node 20+, Python 3.11+, PostgreSQL, and Redis. Set the Paddle keys, email sender, and public domain in the environment variables.",
  },
];
