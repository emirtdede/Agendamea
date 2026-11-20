import React from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import type { LegalDocumentContent } from '../i18n/translations';

interface LegalDocumentViewProps {
  doc: LegalDocumentContent;
  backLabel: string;
  onBack: () => void;
}

export const LegalDocumentView = React.memo(function LegalDocumentView({
  doc,
  backLabel,
  onBack,
}: LegalDocumentViewProps) {
  return (
    <div className="space-y-5">
      {/* Top Back to Settings Navigation Bar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>{backLabel}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
          <span className="truncate">Microsoft Store &amp; Vellium</span>
        </span>
      </div>

      {/* Document Title Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4 space-y-1">
        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
          {doc.title}
        </h3>
        <p className="text-xs text-[var(--text-muted)]">{doc.subtitle}</p>
      </div>

      {/* Document Sections */}
      <div className="space-y-3">
        {doc.sections.map((sec) => (
          <section
            key={sec.heading}
            className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4 space-y-2"
          >
            <h4 className="font-display text-xs font-bold tracking-wide text-[var(--text-primary)]">
              {sec.heading}
            </h4>
            <div className="space-y-2">
              {sec.paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className="text-xs leading-relaxed text-[var(--text-secondary)]"
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom Back Button & Official Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <a
            href="https://vellium.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            <span>vellium.dev</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="mailto:support@vellium.dev"
            className="hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            support@vellium.dev
          </a>
        </div>
      </div>
    </div>
  );
});
