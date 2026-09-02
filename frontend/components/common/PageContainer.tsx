import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
    return (
        <div className={cn("container mx-auto px-4 md:px-8 max-w-7xl pt-8 pb-16", className)} {...props}>
            {children}
        </div>
    );
}
