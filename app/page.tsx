import Link from 'next/link'
import { Zap, Sparkles, CalendarDays, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Sparkles,
    title: 'AI Generation',
    description:
      'Gemini 1.5 Flash generates platform-optimised captions, hashtags, and posting times tailored to your brand voice.',
  },
  {
    icon: CalendarDays,
    title: 'Drag-Drop Calendar',
    description:
      'Visual monthly calendar with colour-coded posts per platform. Drag to reschedule, click to edit — no friction.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description:
      'Track completion rates, platform performance, and content pillar balance with beautiful charts.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600/20 border border-amber-600/30 text-amber-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Gemini 1.5 Flash
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Plan a Month of Content
            <br />
            <span className="text-amber-400">in 60 Seconds</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI generates platform-specific captions, hashtags, and best posting times for your
            brand — automatically. LinkedIn, Twitter, and Instagram, all at once.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 h-12 text-base gap-2 shadow-lg shadow-amber-600/25"
            >
              <Link href="/login">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <span className="text-slate-500 text-sm">No credit card required</span>
          </div>
        </div>

        {/* Calendar preview mockup */}
        <div className="relative max-w-4xl mx-auto px-6 pb-24">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-900/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-slate-400 ml-2">ContentForge — January 2025</span>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-700/30 p-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-xs text-slate-500 py-2 font-medium">
                  {d}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 1
                const hasPosts = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29].includes(day)
                const platforms = day % 3 === 0 ? 'linkedin' : day % 3 === 1 ? 'twitter' : 'instagram'
                return (
                  <div
                    key={i}
                    className="min-h-[64px] rounded-lg bg-slate-800/40 p-1.5 border border-slate-700/30"
                  >
                    {day > 0 && day <= 31 && (
                      <>
                        <span className="text-xs text-slate-400">{day}</span>
                        {hasPosts && (
                          <div
                            className={`mt-1 px-1.5 py-0.5 rounded text-[10px] text-white truncate ${
                              platforms === 'linkedin'
                                ? 'bg-blue-600'
                                : platforms === 'twitter'
                                ? 'bg-sky-500'
                                : 'bg-pink-600'
                            }`}
                          >
                            {platforms === 'linkedin' ? 'in' : platforms === 'twitter' ? 'X' : '📸'} AI post
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
            ContentForge handles the entire content workflow from idea generation to analytics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-600/30 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-600/20 mb-5">
                  <f.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h2 className="text-4xl font-bold mb-4">Start creating better content today</h2>
        <p className="text-slate-400 mb-8">Free forever. No credit card required.</p>
        <Button
          asChild
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white px-10 h-12 gap-2"
        >
          <Link href="/login">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">ContentForge</span>
        </div>
        <p className="text-slate-500 text-sm">AI-powered social media content calendar</p>
      </footer>
    </div>
  )
}
