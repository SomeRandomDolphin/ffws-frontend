"use client";
import { Dialog } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

/** Nonmodal on desktop so the map remains interactive; modal on mobile. */
export function MapPanel({ title, onClose, children }: { title:string; onClose:()=>void; children:ReactNode }) {
  const [mobile,setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change",update);
    return () => query.removeEventListener("change",update);
  },[]);
  return <Dialog.Root open modal={mobile} onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal>{mobile && <Dialog.Overlay className="ds-map-panel-backdrop"/>}<Dialog.Content className="ds-map-panel" aria-describedby={undefined} onInteractOutside={event => { if (!mobile) event.preventDefault(); }}><header className="ds-map-panel-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Tutup detail"><X size={18}/></Button></Dialog.Close></header><div className="ds-map-panel-body">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
