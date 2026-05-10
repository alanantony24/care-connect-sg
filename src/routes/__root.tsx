import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SessionProvider } from "@/lib/session";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="size-14 mx-auto rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-4 text-2xl font-bold">
          K
        </div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This path doesn't exist in Komunity.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f8faf8", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#17231f", media: "(prefers-color-scheme: dark)" },
      { title: "Komunity · Caregiving, together." },
      {
        name: "description",
        content:
          "A peer-to-peer caregiving volunteer platform for Singapore — caregivers post tasks, volunteers help out.",
      },
      { property: "og:title", content: "Komunity · Caregiving, together." },
      { property: "og:description", content: "Care Connect SG is a mobile-first web app for coordinating eldercare support in Singapore." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Komunity · Caregiving, together." },
      { name: "description", content: "Care Connect SG is a mobile-first web app for coordinating eldercare support in Singapore." },
      { name: "twitter:description", content: "Care Connect SG is a mobile-first web app for coordinating eldercare support in Singapore." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a38d115-3a15-4158-b21e-4155360682f9/id-preview-97788bb3--1da17873-3700-4f7e-89c6-362efb4bde25.lovable.app-1778388468758.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a38d115-3a15-4158-b21e-4155360682f9/id-preview-97788bb3--1da17873-3700-4f7e-89c6-362efb4bde25.lovable.app-1778388468758.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle(
      "simple-mode",
      localStorage.getItem("komunity:simple-mode") === "1",
    );
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Outlet />
        <Toaster />
      </SessionProvider>
    </QueryClientProvider>
  );
}
