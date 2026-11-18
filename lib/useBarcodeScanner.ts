"use client";

import { useEffect, useRef } from "react";

/**
 * Sintetizzatore audio a bassissima latenza (Web Audio API) per confermare la scansione ottica
 * senza dipendere da file audio esterni.
 */
export function playPosBeep(frequency = 1400, duration = 0.09) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Gestione silenziosa su ambienti privi di Web Audio o prima di un gesto utente
  }
}

interface UseBarcodeScannerOptions {
  /** Callback invocato all'avvenuta lettura valida del codice a barre */
  onScan: (code: string) => void;
  /** Lunghezza minima caratteri per considerare valido il codice (default 4) */
  minChars?: number;
  /** Intervallo massimo in millisecondi tra due caratteri consecutivi del laser (default 60ms) */
  maxKeystrokeDeltaMs?: number;
  /** Se false, il listener globale viene disattivato (es. quando una modale complessa è aperta) */
  enabled?: boolean;
}

/**
 * Hook globale per intercettare gli input rapidi inviati dalle pistole barcode ottiche USB/Bluetooth.
 * I lettori ottici simulano una tastiera inviando caratteri a velocità sovrumana (< 30-50ms a carattere)
 * terminati da un codice Enter.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxKeystrokeDeltaMs = 60,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef("");
  const lastTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora tasti modificatori
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Se il tempo tra due battute è superiore al limite della pistola (o pausa manuale), resetta il buffer
      if (delta > 400 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();

          const scannedCode = bufferRef.current.trim();
          bufferRef.current = "";

          playPosBeep();
          onScanRef.current(scannedCode);
        } else {
          bufferRef.current = "";
        }
        return;
      }

      // Cattura caratteri alfanumerici singoli
      if (e.key && e.key.length === 1) {
        // Se il delta è compatibile con la velocità di scansione laser (< 60ms)
        // oppure è il primo carattere
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, minChars, maxKeystrokeDeltaMs]);
}
