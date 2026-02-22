"use client";

import { useState, useEffect } from "react";
import Button from "./Button";

export default function UpdateBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Function to handle showing the banner when a new SW is waiting
            const showUpdateBar = (worker: ServiceWorker) => {
                setWaitingWorker(worker);
                setShowBanner(true);
            };

            // Check if there's already a waiting SW
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (!registration) return;

                if (registration.waiting) {
                    showUpdateBar(registration.waiting);
                }

                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // Only show banner if there's an active SW (meaning this is an update)
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            showUpdateBar(newWorker);
                        }
                    });
                });
            });

            // Prevent infinite reload loops
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            // Send message to the waiting SW to activate immediately
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
        }
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600/95 backdrop-blur-md text-white px-4 py-3 shadow-lg flex items-center justify-between flex-wrap gap-3 pt-safe">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Hay una nueva actualización disponible.</span>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={() => setShowBanner(false)}
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                    Ahora no
                </Button>
                <Button
                    onClick={handleUpdate}
                    className="bg-white text-blue-600 hover:bg-slate-100 font-bold"
                    size="sm"
                >
                    Actualizar
                </Button>
            </div>
        </div>
    );
}
