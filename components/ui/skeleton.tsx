import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#649E97]/10 border border-[#649E97]/15 backdrop-blur-sm", className)}
      {...props}
    />
  )
}

export { Skeleton }
