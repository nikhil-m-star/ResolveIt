import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Layout } from "../components/layout/Layout";
import { api } from "../lib/auth";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Loader2, Sparkles, Download, RefreshCcw, FileText, MapPin, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../utils/helpers";

const EMPTY_REPORT_META = {
  source: "",
  cached: false,
  generatedAt: null,
  issueCount: 0
};

const renderReportLink = ({ href = "", children, ...props }) => {
  delete props.node;

  if (href.startsWith("/")) {
    return (
      <Link to={href} className="ai-report-link" {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="ai-report-link" {...props}>
      {children}
    </a>
  );
};

const renderReportTable = ({ ...props }) => {
  delete props.node;

  return (
    <div className="ai-report-table-wrap">
      <table {...props} />
    </div>
  );
};

export function AIInsights() {
  const [report, setReport] = useState("");
  const [reportMeta, setReportMeta] = useState(EMPTY_REPORT_META);
  const [isLoading, setIsLoading] = useState(false);
  const [area, setArea] = useState("");
  const [availableAreas, setAvailableAreas] = useState([]);
  const deferredReport = useDeferredValue(report);
  const hasReport = Boolean(deferredReport.trim());
  const scopeLabel = area || "City Wide";
  const generatedAt = reportMeta.generatedAt ? new Date(reportMeta.generatedAt) : null;

  useEffect(() => {
    let isCancelled = false;

    const fetchAreas = async () => {
      try {
        const { data } = await api.get("/issues/areas");
        if (isCancelled) return;

        startTransition(() => {
          setAvailableAreas(Array.isArray(data?.areas) ? data.areas : []);
        });
      } catch (error) {
        console.error("Failed to fetch areas", error);
      }
    };

    fetchAreas();
    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);

    try {
      const url = area ? `/issues/ai-report?area=${encodeURIComponent(area)}` : "/issues/ai-report";
      const { data } = await api.get(url);

      startTransition(() => {
        setReport(data?.report || "");
        setReportMeta({
          source: data?.source || "ai",
          cached: Boolean(data?.cached),
          generatedAt: data?.generatedAt || new Date().toISOString(),
          issueCount: Number(data?.issueCount || 0)
        });
      });

      if (data?.cached) {
        toast.success("Cached report loaded");
      } else if (data?.source === "instant") {
        toast.success("Fast report ready");
      } else {
        toast.success("AI report ready");
      }
    } catch (error) {
      console.error("Failed to fetch AI report", error);
      toast.error("Failed to generate AI report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!hasReport) {
      toast.error("Generate a report first");
      return;
    }

    toast.success("Exporting report...");
  };

  return (
    <Layout>
      <div className="ai-insights-shell">
        <div className="ai-insights-orb ai-insights-orb-one" />
        <div className="ai-insights-orb ai-insights-orb-two" />

        <div className="ai-insights-container">
          <section className="glass-card ai-insights-hero">
            <div className="ai-insights-copy">
              <div className="ai-insights-kicker">
                <Sparkles className="w-4 h-4" />
                Civic Intelligence Desk
              </div>

              <div className="space-y-3">
                <h1>AI Insights</h1>
                <p>
                  Generate a cleaner operations brief for one sector or the whole city. The report now favors fast
                  turnaround, clearer structure, and a layout that holds up properly on smaller screens.
                </p>
              </div>
            </div>

            <div className="ai-insights-controls">
              <label className="ai-insights-field">
                <span>Coverage</span>
                <select value={area} onChange={(event) => setArea(event.target.value)}>
                  <option value="">City Wide</option>
                  {availableAreas.map((areaName) => (
                    <option key={areaName} value={areaName}>
                      {areaName}
                    </option>
                  ))}
                </select>
              </label>

              <button onClick={fetchReport} disabled={isLoading} className="ai-insights-generate">
                <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                {isLoading ? (hasReport ? "Refreshing report" : "Building report") : "Generate report"}
              </button>
            </div>
          </section>

          {hasReport ? (
            <div className="ai-insights-meta-row">
              <div className="ai-insights-chip">
                <MapPin className="w-3.5 h-3.5" />
                {scopeLabel}
              </div>

              <div className="ai-insights-chip">
                <Bot className="w-3.5 h-3.5" />
                {reportMeta.source === "instant" ? "Fast summary" : "AI synthesis"}
              </div>

              <div className="ai-insights-chip">
                <FileText className="w-3.5 h-3.5" />
                {reportMeta.issueCount} recent reports
              </div>

              {generatedAt ? (
                <div className="ai-insights-chip">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {formatDistanceToNow(generatedAt, { addSuffix: true })}
                </div>
              ) : null}

              {reportMeta.cached ? (
                <div className="ai-insights-chip ai-insights-chip-cached">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cached result
                </div>
              ) : null}
            </div>
          ) : null}

          <section className="glass-card ai-report-card">
            {isLoading && hasReport ? (
              <div className="ai-report-refresh-banner">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating analysis...
              </div>
            ) : null}

            {!hasReport && isLoading ? (
              <div className="ai-report-empty">
                <div className="ai-report-loader">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
                <h3>Building the report</h3>
                <p>
                  Summarizing recent civic signals, hotspot patterns, and response priorities for{" "}
                  <strong>{scopeLabel}</strong>.
                </p>
              </div>
            ) : null}

            {!hasReport && !isLoading ? (
              <div className="ai-report-empty">
                <div className="ai-report-loader ai-report-loader-idle">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <h3>Ready when you are</h3>
                <p>Select a scope and generate a formatted report with metrics, linked incidents, and action items.</p>
              </div>
            ) : null}

            {hasReport ? (
              <div className={cn("ai-report-body", isLoading && "ai-report-body-dimmed")}>
                <div className="ai-report-header">
                  <div>
                    <p className="ai-report-eyebrow">Decision-ready brief</p>
                    <h2>{scopeLabel}</h2>
                  </div>

                  <button onClick={handleExportPDF} className="ai-report-action">
                    <Download className="w-4 h-4" />
                    Export report
                  </button>
                </div>

                <div className="ai-report-divider" />

                <div className="ai-report-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: renderReportLink, table: renderReportTable }}>
                    {deferredReport}
                  </ReactMarkdown>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </Layout>
  );
}
