"use client";

import { Button } from "~/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Critical Error</h1>
            <p className="text-slate-600 mb-6 text-sm">
              {process.env.NODE_ENV === "development"
                ? error.message
                : "A critical error occurred. Please refresh the page."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => reset()}>Retry</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
