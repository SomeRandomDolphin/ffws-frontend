"use client";
import { Select as Primitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
export const Select = Primitive.Root;
export const SelectValue = Primitive.Value;
export function SelectTrigger({className,children,...props}: React.ComponentProps<typeof Primitive.Trigger>) {
  return <Primitive.Trigger className={cn("ds-select-trigger",className)} {...props}>{children}<Primitive.Icon asChild><ChevronDown size={16}/></Primitive.Icon></Primitive.Trigger>;
}
export function SelectContent({children,...props}: React.ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Content position="popper" sideOffset={6} className="ds-select-content" {...props}><Primitive.ScrollUpButton className="ds-select-scroll">↑</Primitive.ScrollUpButton><Primitive.Viewport>{children}</Primitive.Viewport><Primitive.ScrollDownButton className="ds-select-scroll">↓</Primitive.ScrollDownButton></Primitive.Content></Primitive.Portal>;
}
export function SelectItem({children,...props}: React.ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className="ds-select-item" {...props}><Primitive.ItemText>{children}</Primitive.ItemText><Primitive.ItemIndicator><Check size={16}/></Primitive.ItemIndicator></Primitive.Item>;
}
