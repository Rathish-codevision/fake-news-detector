import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, Search, Loader2, ExternalLink, Sparkles, ScanLine } from "lucide-react";
import { detectFakeNews, type DetectionResult } from "@/lib/detect.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Veritas — Live Fake News Detector" },
      {
        name: "description",
        content:
          "Paste any headline, claim, or article. Veritas cross-checks live news across reputable sources and returns a credibility verdict in seconds.",
      },
    ],
  }),
});

const SAMPLES = [
  "NASA confirms the Moon will disappear for 3 days next week",
  "EU passes landmark AI Act regulating high-risk systems",
  "Scientists discover drinking coffee cures cancer, study claims",
];

function verdictMeta(v: DetectionResult["verdict"]) {
  switch (v) {
    case "likely_true":
      return { label: "Likely True", color: "text-success", bg: "bg-success/15", ring: "ring-success/40", icon: ShieldCheck };
    case "likely_false":
      return { label: "Likely False", color: "text-danger", bg: "bg-danger/15", ring: "ring-danger/40", icon: AlertTriangle };
    case "misleading":
      return { label: "Misleading", color: "text-warning", bg: "bg-warning/15", ring: "ring-warning/40", icon: AlertTriangle };
    default:
      return { label: "Unverified", color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", icon: Search };
  }
}

function Index() {
  const [query, setQuery] = useState("");
  const fn = useServerFn(detectFakeNews);
  const mutation = useMutation({
    mutationFn: async (q: string) => fn({ data: { query: q } }),
  });

  const submit = (q: string) => {
    if (q.trim().length < 1) return;
    setQuery(q);
    mutation.mutate(q.trim());
  };

  const result = mutation.data;
  const meta = result ? verdictMeta(result.verdict) : null;

  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered cross-source verification
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Veritas
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Paste a headline, claim, or article snippet. We analyze it against reputable live news sources and return a credibility verdict.
          </p>
        </header>

        <section className="mt-12">
          <div
            className={cn(
              "rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl ring-1 ring-white/5 transition",
              "shadow-2xl",
            )}
          >
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Breaking: country X bans all imports of...'"
              className="min-h-32 resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                  >
                    {s.length > 48 ? s.slice(0, 48) + "…" : s}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => submit(query)}
                disabled={mutation.isPending || query.trim().length < 1}
                size="lg"
                className="gap-2 font-semibold"
                style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" /> Detect
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {mutation.isError && (
          <div className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {(mutation.error as Error).message}
          </div>
        )}

        {result && meta && (
          <section className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={cn("rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl ring-1", meta.ring)}>
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", meta.bg)}>
                  <meta.icon className={cn("h-6 w-6", meta.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className={cn("text-2xl font-bold", meta.color)}>{meta.label}</h2>
                    <Badge variant="outline" className="border-border">
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="mt-2 text-foreground/90">{result.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Reasoning">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.reasoning}</p>
              </Card>
              <Card title="Red flags">
                {result.red_flags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None detected.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.red_flags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Supporting points">
                <ul className="space-y-2">
                  {result.supporting_points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Sources cross-checked">
                <ul className="space-y-2">
                  {result.sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-start gap-2 text-sm hover:text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                        <span className="flex-1">{s.title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase tracking-wide",
                            s.stance === "supports" && "border-success/50 text-success",
                            s.stance === "refutes" && "border-danger/50 text-danger",
                            s.stance === "context" && "border-border text-muted-foreground",
                          )}
                        >
                          {s.stance}
                        </Badge>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          AI verdicts are heuristic — always verify critical claims with primary sources.
        </footer>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
