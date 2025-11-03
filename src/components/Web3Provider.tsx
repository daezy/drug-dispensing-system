"use client";

import { ReactNode, useEffect, useState } from "react";

// Lazy load Web3 dependencies to prevent chunk loading issues
let WagmiProvider: any = null;
let QueryClientProvider: any = null;
let wagmiConfig: any = null;
let QueryClient: any = null;

export function Web3Provider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [web3Loaded, setWeb3Loaded] = useState(false);

  useEffect(() => {
    // Load Web3 dependencies asynchronously
    const loadWeb3 = async () => {
      try {
        const [wagmiModule, queryModule, configModule] = await Promise.all([
          import("wagmi"),
          import("@tanstack/react-query"),
          import("@/lib/web3-config"),
        ]);

        WagmiProvider = wagmiModule.WagmiProvider;
        QueryClient = queryModule.QueryClient;
        QueryClientProvider = queryModule.QueryClientProvider;
        wagmiConfig = configModule.wagmiConfig;

        // Initialize Web3Modal after loading the config
        if (configModule.initializeWeb3Modal) {
          configModule.initializeWeb3Modal();
        }

        setWeb3Loaded(true);
      } catch (error) {
        console.warn("Web3 features unavailable:", error);
        // Continue without Web3 features
      } finally {
        setReady(true);
      }
    };

    loadWeb3();
  }, []);

  // Show loading spinner while Web3 is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If Web3 loaded successfully, wrap with providers
  if (web3Loaded && WagmiProvider && QueryClientProvider && wagmiConfig) {
    const queryClient = new QueryClient();
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  // Fallback: render without Web3 features
  return <>{children}</>;
}
