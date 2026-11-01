import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Teleprompter({ script, title, onClose }: { script: string; title: string; onClose: () => void }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [speed, setSpeed] = useState(35);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  // Camera is preview only: nothing is recorded or uploaded.
  useEffect(() => {
    if (!camera) { stopCamera(); return; }
    let cancelled = false;
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser can't open a camera.");
      setCamera(false);
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then((stream) => {
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {
      if (cancelled) return;
      setCameraError("Camera access was blocked. Allow it in your browser to see yourself behind the text.");
      setCamera(false);
    });
    return () => { cancelled = true; stopCamera(); };
  }, [camera]);
  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const viewport = viewportRef.current;
      const last = lastRef.current ?? now;
      lastRef.current = now;
      if (viewport) {
        viewport.scrollTop += ((now - last) / 1000) * speed;
        if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2) setPlaying(false);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastRef.current = null;
    };
  }, [playing, speed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const restart = () => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    setPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-brand-ink text-brand-surface" role="dialog" aria-modal="true" aria-label={`Teleprompter for ${title}`}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-brand-surface/20 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title || "Talking video"}</p>
          <p className="text-xs text-brand-surface/70">Teleprompter</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCamera((v) => !v)} aria-pressed={camera} className="mr-2 border-brand-surface/40 bg-transparent text-brand-surface hover:bg-brand-surface/10 hover:text-brand-surface">{camera ? <CameraOff /> : <Camera />}{camera ? "Camera off" : "Camera"}</Button>
          <Button variant="outline" size="icon" onClick={() => setFontSize((value) => Math.max(28, value - 4))} aria-label="Smaller text" className="border-brand-surface/40 bg-transparent text-brand-surface hover:bg-brand-surface/10 hover:text-brand-surface"><Minus /></Button>
          <span className="w-12 text-center text-xs tabular-nums">{fontSize}px</span>
          <Button variant="outline" size="icon" onClick={() => setFontSize((value) => Math.min(80, value + 4))} aria-label="Larger text" className="border-brand-surface/40 bg-transparent text-brand-surface hover:bg-brand-surface/10 hover:text-brand-surface"><Plus /></Button>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Close teleprompter" className="ml-2 border-brand-surface/40 bg-transparent text-brand-surface hover:bg-brand-surface/10 hover:text-brand-surface"><X /></Button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        {camera && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />}
        {camera && <div className="pointer-events-none absolute inset-0 bg-brand-ink/45" />}
        {cameraError && <p role="alert" className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-lg bg-brand-surface px-4 py-2 text-xs text-brand-ink shadow">{cameraError}</p>}
        <div ref={viewportRef} className="relative h-full overflow-y-auto scroll-smooth px-[8vw]">
          <div className="mx-auto max-w-5xl py-[42vh] text-center font-semibold leading-[1.55] whitespace-pre-line [text-shadow:0_2px_12px_rgb(0_0_0/60%)]" style={{ fontSize }}>
            {script.trim() || "No saved script is available for this post."}
          </div>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-brand-surface/20 px-4 py-3">
        <Button variant="outline" onClick={restart} className="border-brand-surface/40 bg-transparent text-brand-surface hover:bg-brand-surface/10 hover:text-brand-surface"><RotateCcw /> Restart</Button>
        <Button onClick={() => setPlaying((value) => !value)} className="min-w-32 bg-brand-surface text-brand-ink hover:bg-brand-surface/90">{playing ? <Pause /> : <Play />}{playing ? "Pause" : "Start"}</Button>
        <label className="flex items-center gap-3 text-xs text-brand-surface/80">
          Speed
          <input aria-label="Scroll speed" type="range" min="10" max="90" step="5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="accent-brand-accent" />
          <span className="w-8 tabular-nums">{speed}</span>
        </label>
      </footer>
    </div>
  );
}