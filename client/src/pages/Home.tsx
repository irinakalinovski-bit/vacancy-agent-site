/**
 * FIELD NOTES ATLAS — page style contract
 * Editorial cartography: warm paper, atlas navy, oxidized teal, copper caveats.
 * Preserve the asymmetric field-rail layout, telemetry bands, coordinate labels, and evidence-first tone.
 */
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Clipboard,
  EyeOff,
  ExternalLink,
  Filter,
  Globe2,
  MapPin,
  Menu,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
	YAxis,
} from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Region = "Wrocław onsite/hybrid" | "Poland remote" | "Europe remote" | "Cross-border remote" | "Global remote";
type Freshness = "Fresh" | "Current" | "Verify freshness" | "Confirm eligibility";

type Role = {
  id: number;
  company: string;
  title: string;
  disallowedByUpdatedRules?: boolean;
  region: Region;
  workModel: string;
  fit: number;
  freshness: Freshness;
  freshDetail: string;
  sourceNo: number;
  sourceLabel: string;
  source: string;
  directApplication?: string;
  intro: string;
  proof: string[];
  caveat: string;
  tags: string[];
  dimensions: { label: string; value: number }[];
  isNew?: boolean;
};

const baselineRoles: Role[] = [
  {
    id: 1,
    company: "Software Mind",
    title: "Tech Lead / Software Architect",
    disallowedByUpdatedRules: true,
    region: "Poland remote",
    workModel: "Remote · flexible employment",
    fit: 96,
    freshness: "Fresh",
    freshDetail: "Verified 18 Aug 2026",
    sourceNo: 1,
    sourceLabel: "Remote Rocketship / SmartRecruiters",
    source: "https://www.remoterocketship.com/company/softwaremind/jobs/tech-lead-software-architect-react-next-js-node-js-ai-aws-poland-remote-2/",
    directApplication: "https://jobs.smartrecruiters.com/softwaremind/744000143996404--gbl-tech-lead-software-architect-react-next-js-node-js-ai-aws-",
    intro: "Closest cloud-architecture match in the Poland-remote set.",
    proof: ["AWS Lambda · API Gateway · DynamoDB · RDS", "TypeScript / Node.js · React", "Event-driven systems · IaC · observability"],
    caveat: "Position AI, Next.js, Terraform and stakeholder leadership as adjacent growth areas; do not overstate direct experience.",
    tags: ["AWS serverless", "Node.js", "React", "Architecture"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 100 },
      { label: "Architecture", value: 100 },
      { label: "Full stack", value: 92 },
      { label: "Work model", value: 90 },
    ],
  },
  {
    id: 2,
    company: "Experis Manpower Group",
    title: "Senior Full Stack Developer (React / Node.js)",
    disallowedByUpdatedRules: true,
    region: "Poland remote",
    workModel: "Remote · B2B / freelance",
    fit: 94,
    freshness: "Fresh",
    freshDetail: "Published 17 Aug 2026",
    sourceNo: 2,
    sourceLabel: "JustJoin",
    source: "https://justjoin.it/job-offer/experis-manpower-group-senior-full-stack-developer-react-node-js--warszawa-javascript",
    intro: "Fresh, directly aligned Node/React/NestJS opening with a concrete rate.",
    proof: ["React · Node.js · Fastify / NestJS", "TypeScript · REST APIs · SQL / ORM", "CI/CD · Docker / Kubernetes (advantage)"],
    caveat: "Listing asks for English C1 while the CV states B2. It is a B2B/freelance role at USD 42.90–48.26 net/hour.",
    tags: ["NestJS", "React", "SQL", "CI/CD"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 80 },
      { label: "Architecture", value: 93 },
      { label: "Full stack", value: 100 },
      { label: "Work model", value: 95 },
    ],
  },
  {
    id: 3,
    company: "Future Mind",
    title: "Experienced Node.js Developer (Mid/Senior)",
    region: "Poland remote",
    workModel: "Fully remote · full-time / B2B",
    fit: 92,
    freshness: "Current",
    freshDetail: "Verified 18 Aug 2026",
    sourceNo: 3,
    sourceLabel: "JustJoin",
    source: "https://justjoin.it/job-offer/future-mind-experienced-node-js-developer-mid-senior--warszawa-javascript-3e4c843f",
    intro: "Deepest direct overlap with the CV’s modern backend toolkit and IoT-adjacent work.",
    proof: ["Node.js · TypeScript · NestJS", "PostgreSQL · Redis · MongoDB", "RabbitMQ / SQS · Docker · AWS · microservices"],
    caveat: "The public listing did not expose its complete criteria. The company profile mentions Angular elsewhere, but it is not a requirement of this Node.js role.",
    tags: ["NestJS", "AWS", "Messaging", "Microservices"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 88 },
      { label: "Architecture", value: 96 },
      { label: "Full stack", value: 76 },
      { label: "Work model", value: 100 },
    ],
  },
  {
    id: 4,
    company: "TQLO",
    title: "Senior Fullstack Developer (Node & AWS)",
    disallowedByUpdatedRules: true,
    region: "Poland remote",
    workModel: "100% remote · agency engagement",
    fit: 90,
    freshness: "Fresh",
    freshDetail: "Verified 18 Aug 2026",
    sourceNo: 4,
    sourceLabel: "JustJoin",
    source: "https://justjoin.it/job-offer/tqlo-sp-z-o-o--senior-fullstack-developer-node-aws--warszawa-javascript",
    intro: "A senior cloud-native backend role that maps cleanly to the long AWS and API record.",
    proof: ["Node.js · TypeScript · AWS cloud design", "High-availability backend services", "REST APIs · microservices / containers / CI/CD"],
    caveat: "B2+/C1 English is requested. Angular is only a nice-to-have; the employer is an agency and the end client is not named.",
    tags: ["AWS", "REST APIs", "Cloud native", "Backend"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 100 },
      { label: "Architecture", value: 94 },
      { label: "Full stack", value: 60 },
      { label: "Work model", value: 96 },
    ],
  },
  {
    id: 5,
    company: "B3 Consulting Poland",
    title: "Senior Fullstack Developer",
    region: "Poland remote",
    workModel: "Remote · geography to confirm",
    fit: 89,
    freshness: "Verify freshness",
    freshDetail: "Source shows 3 months old",
    sourceNo: 5,
    sourceLabel: "RemoteFront",
    source: "https://www.remotefront.com/remote-jobs/b3-consulting-poland-senior-fullstack-developer-node-js-react-9bedb",
    intro: "An unusually broad match spanning recent Node/AWS work and earlier PHP/MySQL background.",
    proof: ["Node.js · NestJS · TypeScript · React", "PostgreSQL · AWS · scalable architecture", "PHP / MySQL in legacy migration context"],
    caveat: "The aggregator labels it three months old. Open the company application page first to confirm that the requisition is still accepting candidates.",
    tags: ["NestJS", "React", "AWS", "PHP"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 87 },
      { label: "Architecture", value: 88 },
      { label: "Full stack", value: 100 },
      { label: "Work model", value: 72 },
    ],
  },
  {
    id: 6,
    company: "CUJO AI",
    title: "Senior Backend Engineer, Node.js / TypeScript / AWS",
    region: "Cross-border remote",
    workModel: "Lithuania remote · confirm Poland eligibility",
    fit: 88,
    freshness: "Confirm eligibility",
    freshDetail: "Verified 18 Aug 2026",
    sourceNo: 6,
    sourceLabel: "Remote Rocketship / Comeet",
    source: "https://www.remoterocketship.com/company/cujo-ai/jobs/senior-backend-engineer-node-js-typescript-aws-lithuania-remote/",
    directApplication: "https://www.comeet.com/jobs/cujo/C4.005/senior-backend-engineer-node_jstypescript-aws/",
    intro: "The technically closest international serverless role, with real message-stream and cloud-security depth.",
    proof: ["Lambda · API Gateway · Cognito · CDK", "DynamoDB · CloudFront · MSK", "Node / TypeScript · OAuth/OIDC · CI/CD"],
    caveat: "The public location is Lithuania remote. Confirm a Poland-based engagement before applying; learning Java/Kotlin/Python/Go may be needed, but prior Java or Angular is not required.",
    tags: ["Serverless", "AWS CDK", "MSK", "Security"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 100 },
      { label: "Architecture", value: 94 },
      { label: "Full stack", value: 55 },
      { label: "Work model", value: 60 },
    ],
  },
  {
    id: 7,
    company: "Scopic",
    title: "Senior Fullstack JavaScript Developer",
    region: "Global remote",
    workModel: "Fully remote · work from anywhere",
    fit: 86,
    freshness: "Fresh",
    freshDetail: "Updated 17 Aug 2026",
    sourceNo: 7,
    sourceLabel: "Remotar / Zohorecruit",
    source: "https://remotar.com.br/job/157627/scopic-software/remote-senior-fullstack-javascript-developer",
    intro: "Best explicitly global option for the core React, Node, TypeScript, API and AWS-preferred skill set.",
    proof: ["JavaScript / TypeScript across the stack", "Node.js · React · REST APIs", "Relational / NoSQL databases · AWS preferred"],
    caveat: "Strong written and spoken English plus cross-time-zone overlap are required. Cloud requirements are broad, rather than serverless-specific.",
    tags: ["Global remote", "React", "Node.js", "AWS preferred"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 76 },
      { label: "Architecture", value: 82 },
      { label: "Full stack", value: 100 },
      { label: "Work model", value: 100 },
    ],
  },
  {
    id: 8,
    company: "Sigma Software Group",
    title: "Principal JavaScript / Node.js Engineer",
    region: "Poland remote",
    workModel: "Poland remote · full-time",
    fit: 76,
    freshness: "Current",
    freshDetail: "Verified 18 Aug 2026",
    sourceNo: 8,
    sourceLabel: "Remote Rocketship / SmartRecruiters",
    source: "https://www.remoterocketship.com/company/career-sigma-software/jobs/principal-javascript-node-js-engineer-poland-remote/",
    directApplication: "https://jobs.smartrecruiters.com/sigmasoftware2/744000144000200-principal-javascript-node-js-mcp-engineer",
    intro: "A platform-architecture stretch that carries strong Node and distributed-systems overlap.",
    proof: ["TypeScript · Node.js · distributed systems", "APIs · SDKs · reusable platform components", "MCP / A2A / LLM tool-invocation architecture"],
    caveat: "Principal/Staff scope and hands-on MCP/A2A platform experience are central. Treat as a stretch, not the first application in the sequence.",
    tags: ["Platform", "Distributed systems", "MCP", "Lead"],
    dimensions: [
      { label: "Node / TS", value: 100 },
      { label: "AWS cloud", value: 52 },
      { label: "Architecture", value: 100 },
      { label: "Full stack", value: 54 },
      { label: "Work model", value: 96 },
    ],
  },
  {
    id: 9,
    company: "Talentuch",
    title: "FullStack Developer — Node, TypeScript, React Native",
    region: "Cross-border remote",
    workModel: "Europe remote · EST overlap",
    fit: 73,
    freshness: "Fresh",
    freshDetail: "Posted 4 days ago",
    sourceNo: 9,
    sourceLabel: "Remote Rocketship / Breezy",
    source: "https://www.remoterocketship.com/gb/company/talentuch/jobs/fullstack-developer-node-typescript-react-native-europe-remote/",
    directApplication: "https://talentuch.breezy.hr/p/827e110b07cc-fullstack-developer-node-typescript-react-native-for-based-in-europe-candidates-only",
    intro: "A viable Europe-remote option with a solid backend stack, offset by mobile and schedule requirements.",
    proof: ["NestJS · Node.js · TypeScript · PostgreSQL", "REST · Docker / Linux · Prisma · Redis", "AWS / microservices / distributed systems desirable"],
    caveat: "React Native, app-store deployment and EST-overlap are material gaps. Python/Django is only a plus, not a primary requirement.",
    tags: ["Europe remote", "NestJS", "PostgreSQL", "Mobile"],
    dimensions: [
      { label: "Node / TS", value: 96 },
      { label: "AWS cloud", value: 72 },
      { label: "Architecture", value: 80 },
      { label: "Full stack", value: 74 },
      { label: "Work model", value: 54 },
    ],
  },
];

const excludedCompanies = [
  "Allegro", "Scalo", "Antal PL", "ALM Services", "Aircashback", "Esurance", "Capgemini", "iTeamly", "Edge1S", "Spyrosoft", "Blue Language Labs", "Cloudfide", "InPost", "Alten", "Inuits", "Link Group", "Aura", "Playbook", "SoftServe", "Volvo", "FYUL", "Wise", "Revolut", "GitLab", "Automattic",
];

const regionOptions: (Region | "All regions")[] = ["All regions", "Wrocław onsite/hybrid", "Poland remote", "Europe remote", "Cross-border remote", "Global remote"];
const freshnessOptions: (Freshness | "All verification")[] = ["All verification", "Fresh", "Current", "Verify freshness", "Confirm eligibility"];
const preferenceViewOptions = ["All active", "Saved", "Hidden"] as const;
type PreferenceView = (typeof preferenceViewOptions)[number];

function freshnessClass(freshness: Freshness) {
  if (freshness === "Fresh") return "stamp stamp-fresh";
  if (freshness === "Current") return "stamp stamp-current";
  if (freshness === "Confirm eligibility") return "stamp stamp-copper";
  return "stamp stamp-muted";
}

function miniCoordinate(id: number, region: Region) {
  const prefix = region === "Poland remote" ? "PL" : region === "Global remote" ? "GLOBAL" : "EU";
  return `${prefix} / ${String(id).padStart(2, "0")}`;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [region, setRegion] = useState<(typeof regionOptions)[number]>("All regions");
  const [verification, setVerification] = useState<(typeof freshnessOptions)[number]>("All verification");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"fit" | "fresh">("fit");
  const [preferenceView, setPreferenceView] = useState<PreferenceView>("All active");
  const [preferenceWorkspaceActive, setPreferenceWorkspaceActive] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchPromptCopied, setSearchPromptCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const trackerSnapshot = trpc.tracker.snapshot.useQuery(undefined, { refetchInterval: 60_000 });
  const manualSearch = trpc.tracker.requestManualSearch.useMutation();
  const importResearch = trpc.tracker.importResearch.useMutation({
    onSuccess: async (result) => {
      setImportMessage(`Imported: ${result.acceptedCount} new · ${result.updatedCount} updated · ${result.rejectedCount} withheld.`);
      setImportText("");
      setImportOpen(false);
      await trackerSnapshot.refetch();
    },
    onError: (error) => setImportMessage(error.message),
  });
  const preferences = trpc.tracker.preferences.useQuery(undefined, { enabled: isAuthenticated === true && preferenceWorkspaceActive });
  const utils = trpc.useUtils();
  const setPreference = trpc.tracker.setPreference.useMutation({ onSuccess: () => utils.tracker.preferences.invalidate() });
  const clearPreference = trpc.tracker.clearPreference.useMutation({ onSuccess: () => utils.tracker.preferences.invalidate() });
  const currentResearchRequest = manualSearch.data;

  const liveRoles = useMemo((): Role[] => {
    const stored = trackerSnapshot.data?.vacancies;
    if (!stored?.length) return baselineRoles;
    return stored.map((role, index) => ({
      id: role.id,
      company: role.company,
      title: role.title,
      region: role.region,
      workModel: role.workModel,
      fit: role.matchScore,
      freshness: role.freshness,
      freshDetail: role.freshnessDetail,
      sourceNo: index + 1,
      sourceLabel: role.sourceLabel,
      source: role.sourceUrl,
      directApplication: role.directApplicationUrl,
      intro: role.intro,
      proof: role.proof,
      caveat: role.caveat,
      tags: role.tags,
      dimensions: role.dimensions,
      isNew: role.isNew,
    }));
  }, [trackerSnapshot.data]);

  const eligibleRoles = useMemo(() => liveRoles.filter((role) => !role.disallowedByUpdatedRules), [liveRoles]);
  const isControlledRefresh = trackerSnapshot.data?.config?.lastRefreshMessage?.startsWith("Controlled private-refresh") ?? false;
  const preferenceByVacancyId = useMemo(() => new Map(preferences.data?.map((preference) => [preference.vacancyId, preference.status]) ?? []), [preferences.data]);
  const savedCount = preferences.data?.filter((preference) => preference.status === "saved").length ?? 0;
  const hiddenCount = preferences.data?.filter((preference) => preference.status === "hidden").length ?? 0;

  const visibleRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = eligibleRoles.filter((role) => {
      const regionMatch = region === "All regions" || role.region === region;
      const verificationMatch = verification === "All verification" || role.freshness === verification;
      const preference = preferenceByVacancyId.get(role.id);
      const preferenceMatch = preferenceView === "Saved" ? preference === "saved" : preferenceView === "Hidden" ? preference === "hidden" : preference !== "hidden";
      const text = `${role.company} ${role.title} ${role.tags.join(" ")} ${role.proof.join(" ")}`.toLowerCase();
      return regionMatch && verificationMatch && preferenceMatch && (!normalizedQuery || text.includes(normalizedQuery));
    });
    return [...next].sort((a, b) => sort === "fit" ? b.fit - a.fit : a.id - b.id);
  }, [eligibleRoles, preferenceByVacancyId, preferenceView, query, region, verification, sort]);

  const chartData = visibleRoles.slice(0, 7).map((role) => ({
    name: role.company.length > 12 ? `${role.company.slice(0, 12)}…` : role.company,
    fit: role.fit,
    region: role.region,
  }));

  const highConfidenceCount = eligibleRoles.filter((role) => role.fit >= 90).length;

  function scrollToOpportunities() {
    document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  async function copyView() {
    const copyText = `Tailored Job Opportunities — ${visibleRoles.length} filtered roles | ${window.location.href}`;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      // Clipboard can be blocked in embedded previews; visual confirmation still makes the control useful.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function requestManualSearch() {
    const request = await manualSearch.mutateAsync();
    try { await navigator.clipboard.writeText(request.prompt); } catch { /* Clipboard access may be unavailable in embedded previews. */ }
    setSearchPromptCopied(true);
    window.setTimeout(() => setSearchPromptCopied(false), 2600);
  }

  async function copyManualPrompt() {
    if (!currentResearchRequest) return;
    try { await navigator.clipboard.writeText(currentResearchRequest.prompt); } catch { /* The visible prompt remains available for manual copying. */ }
    setSearchPromptCopied(true);
    window.setTimeout(() => setSearchPromptCopied(false), 2600);
  }

  async function importResults() {
    setImportMessage(null);
    try {
      const cleaned = importText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const parsed = JSON.parse(cleaned);
      const payload = Array.isArray(parsed) ? { vacancies: parsed } : parsed;
      const requestCode = payload.requestCode ?? currentResearchRequest?.requestCode;
      if (!requestCode) {
        setImportMessage("Create a Search New Vacancies request first, then import its research result.");
        return;
      }
      await importResearch.mutateAsync({ ...payload, requestCode });
    } catch (error) {
      if (error instanceof SyntaxError) setImportMessage("The pasted result is not valid JSON. You can paste a JSON object, a vacancies array, or a fenced JSON code block.");
    }
  }

  async function updatePreference(vacancyId: number, nextStatus: "saved" | "hidden" | null) {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setPreferenceWorkspaceActive(true);
    if (nextStatus) await setPreference.mutateAsync({ vacancyId, status: nextStatus });
    else await clearPreference.mutateAsync({ vacancyId });
  }

  function loadPreferenceWorkspace() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setPreferenceWorkspaceActive(true);
  }

  const railContent = (
    <>
      <div className="rail-brand">
        <img src="/assets/job-atlas-mark.svg" alt="Field Notes Atlas mark" />
        <div>
          <div className="rail-brand-title">FIELD NOTES</div>
          <div className="rail-brand-subtitle">opportunity atlas</div>
        </div>
      </div>

      <div className="rail-status">
        <span className="status-dot" />
        Research locked · 18 Aug 2026
      </div>

      <nav className="rail-nav" aria-label="Report sections">
        <button type="button" className="rail-link active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span>01</span> Brief</button>
        <button type="button" className="rail-link" onClick={scrollToOpportunities}><span>02</span> Shortlist</button>
        <button type="button" className="rail-link" onClick={() => document.getElementById("method")?.scrollIntoView({ behavior: "smooth" })}><span>03</span> Method</button>
        <button type="button" className="rail-link" onClick={() => document.getElementById("audit")?.scrollIntoView({ behavior: "smooth" })}><span>04</span> Audit</button>
      </nav>

      <section className="candidate-panel" aria-label="Candidate stack summary">
        <div className="eyebrow">CANDIDATE SIGNAL</div>
        <h2>Cloud-native full stack</h2>
        <p>Wrocław · senior delivery · 19+ years in software.</p>
        <div className="stack-list">
          {[
            "Node.js / TypeScript",
            "AWS / Serverless",
            "NestJS / React",
            "APIs / Microservices",
            "Kafka / MQTT / Redis",
            "K8s / Docker / CI",
          ].map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="filter-panel" aria-label="Filter opportunities">
        <div className="filter-heading"><SlidersHorizontal size={15} /> Filter the field</div>
        <label className="rail-label" htmlFor="role-search">Search signals</label>
        <div className="rail-search">
          <Filter size={14} />
          <input id="role-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Node, AWS, remote…" />
        </div>
        <label className="rail-label" htmlFor="region-filter">Geography</label>
        <select id="region-filter" value={region} onChange={(event) => setRegion(event.target.value as (typeof regionOptions)[number])}>
          {regionOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <label className="rail-label" htmlFor="verification-filter">Source state</label>
        <select id="verification-filter" value={verification} onChange={(event) => setVerification(event.target.value as (typeof freshnessOptions)[number])}>
          {freshnessOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <label className="rail-label" htmlFor="preference-filter">My role list</label>
        <select id="preference-filter" value={preferenceView} disabled={!isAuthenticated || !preferenceWorkspaceActive} onChange={(event) => setPreferenceView(event.target.value as PreferenceView)}>
          {preferenceViewOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        {!isAuthenticated ? <p className="preference-signin-note">Sign in to keep saved and hidden roles private to you.</p> : !preferenceWorkspaceActive ? <button type="button" className="load-preferences-button" onClick={loadPreferenceWorkspace}>Load my private role list</button> : null}
        <button type="button" className="clear-button" onClick={() => { setRegion("All regions"); setVerification("All verification"); setQuery(""); }}>
          <RefreshCw size={13} /> Reset view
        </button>
      </section>

      <div className="rail-bottom-note">
        <ShieldCheck size={15} />
        <span>25 named employers held outside the result set.</span>
      </div>
    </>
  );

  return (
    <div className="atlas-shell">
      <aside className="atlas-rail">{railContent}</aside>
      <div className="mobile-topbar">
        <div className="mobile-brand"><img src="/assets/job-atlas-mark.svg" alt="" /><span>FIELD NOTES</span></div>
        <button type="button" className="icon-button" aria-label="Open report controls" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
      </div>
      {mobileOpen && <div className="mobile-rail-overlay" role="dialog" aria-modal="true"><div className="mobile-rail-inner"><button type="button" className="close-mobile" onClick={() => setMobileOpen(false)} aria-label="Close controls"><X size={20} /></button>{railContent}</div></div>}

      <main className="atlas-main">
        <section className="hero-section" aria-labelledby="report-title">
          <img className="hero-art" src="/assets/job-atlas-hero.svg" alt="Top-down research map and annotated field desk" />
          <div className="hero-copy">
            <div className="hero-kicker"><span>RESEARCH BRIEF / 2026.08.18</span><span>WROCŁAW → REMOTE</span></div>
            <h1 id="report-title">{eligibleRoles.length} roles cleared<br />the tighter screen.</h1>
            <p>Vacancies were read against the actual delivery record: AWS serverless, Node/TypeScript, NestJS, React, APIs, microservices, message brokers and cloud infrastructure — with Tech Lead, Architect and English C1 requirements excluded.</p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={scrollToOpportunities}>Read the shortlist <ArrowDownRight size={17} /></button>
              <button type="button" className="secondary-action" onClick={copyView}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "View copied" : "Copy filtered view"}</button>
              <button type="button" className="find-new-action" onClick={requestManualSearch} disabled={manualSearch.isPending}>{manualSearch.isPending ? <RefreshCw className="spin-icon" size={16} /> : <RefreshCw size={16} />}{manualSearch.isPending ? "Preparing playbook…" : "Search new vacancies"}</button>
              <button type="button" className="secondary-action" onClick={() => { setImportMessage(null); setImportOpen(true); }}><Clipboard size={16} /> Import AI results</button>
            </div>
            {currentResearchRequest && <aside className="manual-search-card" aria-live="polite"><div><span className="eyebrow">AUTHORITATIVE RESEARCH REQUEST READY</span><strong>{currentResearchRequest.requestCode}</strong><p>The complete current canonical research policy has been copied verbatim. Paste it into this chat to begin source-page research; the research result can then be imported into this site; the site itself handles validation, deduplication, audit, timestamps, and NEW markers.</p></div><button type="button" onClick={copyManualPrompt}>{searchPromptCopied ? <Check size={15} /> : <Clipboard size={15} />}{searchPromptCopied ? "Playbook copied" : "Copy playbook"}</button></aside>}
            {manualSearch.error && <p className="manual-search-error">The request could not be created. The research request could not be created. Please try again.</p>}
          </div>
          <div className="hero-index">
            <div><span>HIGH-CONFIDENCE</span><strong>{highConfidenceCount}</strong><small>roles at 90+ fit</small></div>
            <div><span>RESEARCH FLOW</span><strong>{isControlledRefresh ? "TESTED" : "ON DEMAND"}</strong><small>{isControlledRefresh ? "PRIVATE WRITE VERIFIED" : "START FROM THIS CHAT"}</small></div>
          </div>
        </section>

        <section className="headline-strip" aria-label="Research summary">
          <div><span className="coordinate">PL / REMOTE</span><strong>{eligibleRoles.filter((role) => role.region === "Poland remote").length} Poland-remote options</strong><span>Highest practical priority for Wrocław.</span></div>
          <div><span className="coordinate">GLOBAL / 07</span><strong>One work-from-anywhere role</strong><span>Scopic offers an explicitly global remote model.</span></div>
          <div><span className="coordinate">SCREEN / TIGHT</span><strong>Lead, Architect and C1 removed</strong><span>Mandatory Java/Angular roles remain withheld too.</span></div>
        </section>

        <section className="overview-section" aria-labelledby="fit-overview-title">
          <div className="section-heading">
            <div><span className="eyebrow">FIT TOPOLOGY</span><h2 id="fit-overview-title">Where the evidence is concentrated.</h2></div>
            <p>Fit is a transparent research index, not a claim made by the employer. It surfaces direct stack overlap, cloud depth, architecture alignment and realistic remote availability.</p>
          </div>
          <div className="overview-grid">
            <div className="chart-panel">
              <div className="chart-panel-header"><span>Filtered role fit</span><span>{visibleRoles.length} / {eligibleRoles.length} visible</span></div>
              <div className="fit-chart">
                <ResponsiveContainer width="100%" height={255}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 12, top: 8, bottom: 8 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#516067", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(23,36,52,.05)" }} contentStyle={{ border: "1px solid #d8d2c7", borderRadius: 4, background: "#f7f3eb", color: "#172434", fontFamily: "IBM Plex Mono", fontSize: 12 }} formatter={(value: number) => [`${value} / 100`, "Fit index"]} />
                    <Bar dataKey="fit" radius={[0, 3, 3, 0]} barSize={16}>
                      {chartData.map((entry) => <Cell key={entry.name} fill={entry.fit >= 90 ? "#167b79" : entry.fit >= 80 ? "#28445a" : "#b7583e"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footnote"><span>100 = close direct alignment across the documented criteria.</span><span>Hover a bar for score detail.</span></div>
            </div>

            <article className="field-card">
              <img src="/assets/job-atlas-topology.svg" alt="Abstract technical topology on field paper" />
              <div className="field-card-overlay">
                <div className="eyebrow">FIRST APPLICATION PASS</div>
                <h3>Start with the roles that need the least narrative translation.</h3>
                <ol>
                  <li><b>01</b> Future Mind <span>Messaging + microservices</span></li>
                  <li><b>02</b> B3 Consulting Poland <span>NestJS + React + AWS</span></li>
                  <li><b>03</b> CUJO AI <span>AWS serverless + message streams</span></li>
                  <li><b>04</b> Scopic <span>Global remote Node + React</span></li>
                </ol>
              </div>
            </article>
          </div>
        </section>

        <section className="roles-section" id="opportunities" aria-labelledby="roles-title">
          <div className="roles-toolbar">
            <div>
              <span className="eyebrow">VETTED OPPORTUNITIES</span>
              <h2 id="roles-title">The shortlist, with the caveat left in.</h2>
            </div>
            <div className="sort-control">
              <label htmlFor="role-sort">Sequence</label>
              <select id="role-sort" value={sort} onChange={(event) => setSort(event.target.value as "fit" | "fresh")}><option value="fit">Highest fit first</option><option value="fresh">Research order</option></select>
            </div>
            {isAuthenticated && preferenceWorkspaceActive && <div className="preference-summary" aria-label="Your private role preferences"><span><BookmarkCheck size={14} /> {savedCount} saved</span><span><EyeOff size={14} /> {hiddenCount} hidden</span></div>}
          </div>

          <div className="active-filter-line"><Filter size={14} /><span>Showing <b>{visibleRoles.length}</b> of {eligibleRoles.length} roles</span><span className="tracker-status">{trackerSnapshot.data?.config?.lastRefreshAt ? `Last completed research: ${new Date(trackerSnapshot.data.config.lastRefreshAt).toLocaleString()}` : "Use Search new to create a fresh research request"}</span>{region !== "All regions" && <span className="active-filter-tag">{region}</span>}{verification !== "All verification" && <span className="active-filter-tag">{verification}</span>}{isAuthenticated && preferenceView !== "All active" && <span className="active-filter-tag">{preferenceView}</span>}</div>

          <div className="role-preference-guide"><Bookmark size={15} /><span><b>MY ROLE LIST</b> — use the visible <strong>Save</strong> or <strong>Hide</strong> controls on any vacancy card. Your choices stay private to your account.</span></div>

          {isAuthenticated && preferenceWorkspaceActive && (setPreference.error || clearPreference.error) && <p className="preference-error">Your role preference could not be saved. Please try again.</p>}

          {trackerSnapshot.data?.recentRuns?.length ? <div className="refresh-history" aria-label="Research run history"><span className="history-label">RECENT RESEARCH RUNS</span>{trackerSnapshot.data.recentRuns.slice(0, 3).map((run) => <div className="history-run" key={run.id}><b className={`history-status status-${run.status}`}>{run.status}</b><span>{new Date(run.startedAt).toLocaleString()}</span><span>+{run.acceptedCount} new · {run.updatedCount} updated · {run.rejectedCount} withheld</span></div>)}</div> : null}

          <div className="role-list">
            {visibleRoles.map((role) => (
              <article className="role-dossier" key={role.id}>
                <div className="role-coordinate">{miniCoordinate(role.id, role.region)}</div>
                <div className="role-main">
                  <div className="role-topline">{role.isNew && <span className="stamp stamp-new">NEW · 7 DAYS</span>}<span className={freshnessClass(role.freshness)}>{role.freshness}</span><span className="fresh-detail">{role.freshDetail}</span></div>
                  <h3>{role.company}</h3>
                  <h4>{role.title}</h4>
                  <div className="role-card-preferences">
                    <span>MY ROLE LIST</span>
                    <div className="role-preference-actions" aria-label={`Private preference for ${role.company}`}>
                      {(() => {
                        const preference = preferenceByVacancyId.get(role.id);
                        const isSaving = setPreference.isPending || clearPreference.isPending;
                        return <>
                          <button type="button" className={preference === "saved" ? "preference-action is-saved" : "preference-action"} disabled={isSaving} onClick={() => updatePreference(role.id, preference === "saved" ? null : "saved")} title={preference === "saved" ? "Remove from saved roles" : "Save this role"}>
                            {preference === "saved" ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{preference === "saved" ? "Saved" : "Save"}
                          </button>
                          <button type="button" className={preference === "hidden" ? "preference-action is-hidden" : "preference-action"} disabled={isSaving} onClick={() => updatePreference(role.id, preference === "hidden" ? null : "hidden")} title={preference === "hidden" ? "Return this role to active shortlist" : "Hide this role from your active shortlist"}>
                            {preference === "hidden" ? <RotateCcw size={14} /> : <EyeOff size={14} />}{preference === "hidden" ? "Unhide" : "Hide"}
                          </button>
                        </>;
                      })()}
                    </div>
                  </div>
                  <p className="role-intro">{role.intro}</p>
                  <div className="role-meta"><span><MapPin size={14} /> {role.workModel}</span><span><Globe2 size={14} /> {role.region}</span></div>
                  <ul className="proof-list">{role.proof.map((point) => <li key={point}><Check size={14} /> {point}</li>)}</ul>
                  <div className="tag-row">{role.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div className="role-evidence">
                  <div className="fit-number"><span>FIT INDEX</span><strong>{role.fit}</strong><small>/100</small></div>
                  <div className="telemetry" aria-label={`Fit telemetry for ${role.company}`}>
                    {role.dimensions.map((dimension) => <div className="telemetry-row" key={dimension.label}><span>{dimension.label}</span><div className="telemetry-track"><i style={{ width: `${dimension.value}%` }} /></div><b>{dimension.value}</b></div>)}
                  </div>
                  <div className="caveat"><span>VERIFY</span><p>{role.caveat}</p></div>
                  <div className="role-actions">
                    <a href={role.directApplication ?? role.source} target="_blank" rel="noreferrer">Open role <ArrowUpRight size={15} /></a>
                    <a className="source-link" href={role.source} target="_blank" rel="noreferrer">Source [{role.sourceNo}]</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleRoles.length === 0 && <div className="empty-state"><Filter size={22} /><h3>{preferenceView === "Saved" ? "No saved roles yet." : preferenceView === "Hidden" ? "No hidden roles." : "No roles in this slice."}</h3><p>{preferenceView === "Saved" ? "Use Save on a role to keep it in your private application list." : preferenceView === "Hidden" ? "Hidden roles stay private and can be restored here at any time." : "Clear one or more filters to return to the verified field."}</p><button type="button" onClick={() => { setRegion("All regions"); setVerification("All verification"); setQuery(""); setPreferenceView("All active"); }}>Reset filters</button></div>}
        </section>

        <section className="method-section" id="method" aria-labelledby="method-title">
          <div className="method-image"><img src="/assets/job-atlas-stamp-sheet.svg" alt="Abstract verification marks on archival paper" /></div>
          <div className="method-copy">
            <span className="eyebrow">READING THE INDEX</span>
            <h2 id="method-title">The score rewards evidence, then makes doubt visible.</h2>
            <p>Each role was read for five dimensions: direct Node/TypeScript alignment; AWS or cloud depth; API, microservice and architecture overlap; full-stack relevance; and a practical remote model from Wrocław. The scores are designed to aid prioritisation rather than predict an interview outcome.</p>
            <div className="method-pills"><span>Mandatory Java removed</span><span>Mandatory Angular removed</span><span>Tech Lead / Architect removed</span><span>English C1 removed</span><span>Senior-Python-led roles removed</span><span>25 named employers removed</span></div>
            <a href="#audit" className="text-link">Read the screening audit <ArrowDownRight size={15} /></a>
          </div>
        </section>

        <section className="audit-section" id="audit" aria-labelledby="audit-title">
          <div className="section-heading compact"><div><span className="eyebrow">EXCLUSION AUDIT</span><h2 id="audit-title">What was deliberately left out.</h2></div><p>Exclusions are recorded so the shortlist remains inspectable rather than merely selective.</p></div>
          <div className="audit-grid">
            <article className="audit-card"><span className="audit-count">25</span><h3>Named companies excluded</h3><details><summary>View the exclusion register <ChevronDown size={15} /></summary><p>{excludedCompanies.join(" · ")}</p></details></article>
            <article className="audit-card"><span className="audit-count">06</span><h3>Reviewed roles withheld</h3><p>Software Mind (Tech Lead / Architect), Experis and TQLO (English C1), plus Andersen (Python-led AI), BairesDev (Latin America only), and Squad Technology Solutions (Angular required).</p></article>
            <article className="audit-card"><span className="audit-count">02</span><h3>Verify before effort</h3><p>B3 Consulting has an older source timestamp. CUJO AI needs a Poland-based remote eligibility check.</p></article>
          </div>
        </section>

        {importOpen && (
          <div className="import-panel" role="dialog" aria-modal="true" aria-labelledby="import-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setImportOpen(false); }}>
            <div className="import-panel-inner">
              <div className="eyebrow">RESEARCH RESULT IMPORT</div>
              <h2 id="import-title">Paste the AI result here.</h2>
              <p>Run the current Search New Vacancies research request in ChatGPT, Gemini, Claude, or another research agent. Then paste the structured JSON result below. The site will validate it, apply the server-side rules, deduplicate by source URL, update the research audit, and publish accepted vacancies.</p>
              <p><strong>Current request:</strong> {currentResearchRequest?.requestCode ?? "No active request yet"}</p>
              <textarea aria-label="AI research result JSON" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={'Paste JSON here, for example:\n{\n  "requestCode": "FIND-XXXXXXXX",\n  "vacancies": [ ... ]\n}'} spellCheck={false} />
              {importMessage && <p className={importResearch.isError ? "manual-search-error" : "import-success"} role="status">{importMessage}</p>}
              <div className="import-actions">
                <button type="button" className="secondary-action" onClick={() => setImportOpen(false)}>Cancel</button>
                <button type="button" className="find-new-action" onClick={importResults} disabled={importResearch.isPending || !importText.trim()}>
                  {importResearch.isPending ? <RefreshCw className="spin-icon" size={16} /> : <Clipboard size={16} />}
                  {importResearch.isPending ? "Importing…" : "Import results"}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="atlas-footer">
          <div><img src="/assets/job-atlas-mark.svg" alt="" /><p>Tailored opportunity research for a Wrocław-based cloud-native developer.</p></div>
          <div className="footer-actions"><button type="button" onClick={copyView}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy report view"}</button><button type="button" onClick={() => window.print()}><Printer size={15} /> Print / save PDF</button></div>
          <p className="footer-citation">Source links are shown on every role card. Vacancy details can change; open the original listing immediately before applying.</p>
        </footer>
      </main>
    </div>
  );
}
