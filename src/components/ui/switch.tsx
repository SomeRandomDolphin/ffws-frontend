"use client";
import { Switch as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Switch({className,...props}:React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root className={cn("ds-switch",className)} {...props}><Primitive.Thumb className="ds-switch-thumb"/></Primitive.Root>; }
