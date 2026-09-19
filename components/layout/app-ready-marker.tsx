"use client";

import { useEffect } from "react";
import { dispatchAppReady } from "@/lib/pwa/app-lista";

export function AppReadyMarker() {
  useEffect(() => {
    dispatchAppReady();
  }, []);

  return null;
}
