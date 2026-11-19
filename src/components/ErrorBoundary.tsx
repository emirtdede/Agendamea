import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Agendamea UI ErrorBoundary:', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--canvas)] p-6 text-[var(--text-primary)]">
          <div className="max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center shadow-lg space-y-3">
            <h1 className="font-display text-lg font-bold tracking-tight">
              Beklenmeyen bir hata oluştu
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Verileriniz bilgisayarınızda güvenle saklanıyor. Sayfayı yenileyerek kaldığınız yerden devam edebilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Uygulamayı Yenile</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
