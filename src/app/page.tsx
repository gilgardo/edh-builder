import Link from 'next/link';
import { Search, BarChart3, Users, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';

const features = [
  {
    title: 'Powerful Card Search',
    description:
      'Search through thousands of cards with Scryfall integration. Filter by color, type, mana cost, and more.',
    icon: Search,
    color: 'primary',
  },
  {
    title: 'Deck Analytics',
    description:
      'Analyze mana curves, color distribution, and card type breakdown to optimize your deck performance.',
    icon: BarChart3,
    color: 'secondary',
  },
  {
    title: 'Community Sharing',
    description:
      'Share your decks, discover popular builds, and get inspired by other Commander players.',
    icon: Users,
    color: 'accent',
  },
];

const highlights = [
  {
    title: 'Real-time Validation',
    description: 'Instant color identity and deck legality checks as you build.',
    icon: Zap,
  },
  {
    title: 'Smart Suggestions',
    description: 'Get card recommendations based on your commander and strategy.',
    icon: Sparkles,
  },
  {
    title: 'Format Compliance',
    description: 'Automatic checks for banned cards and format-specific rules.',
    icon: Shield,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Mana Symbol Display */}
            <div className="mb-8 flex justify-center gap-2">
              <span className="mana-badge mana-badge-w scale-125">W</span>
              <span className="mana-badge mana-badge-u scale-125">U</span>
              <span className="mana-badge mana-badge-b scale-125">B</span>
              <span className="mana-badge mana-badge-r scale-125">R</span>
              <span className="mana-badge mana-badge-g scale-125">G</span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Build Your Perfect{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Commander
              </span>{' '}
              Deck
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              The ultimate MTG Commander deck builder. Search cards, analyze your mana curve, validate
              color identity, and share your decks with the community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="gap-2">
                <Link href="/decks/new">
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/decks">Explore Decks</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Scryfall powered</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to help you build, analyze, and share your Commander decks.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="relative overflow-hidden border-border bg-card transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}/10`}
                  >
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Highlights Section */}
      <section className="border-y border-border bg-muted/30 py-20">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <highlight.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary px-6 py-16 text-center md:px-16">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 opacity-30">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
            </div>

            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Build Your Deck?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
              Join thousands of Commander players building and sharing their decks. Start building
              your perfect deck today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild className="gap-2">
                <Link href="/decks/new">
                  Create Your Deck
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/login">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
