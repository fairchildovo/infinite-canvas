import type { ComponentProps } from "react";
import { Zap } from "lucide-react";

import { useConfigStore } from "@/stores/use-config-store";

export function CreditSymbol({ className, ...props }: ComponentProps<"span">) {
    return (
        <span {...props} className={`inline-flex items-center justify-center ${className || ""}`}>
            <Zap className="size-[1em] fill-current" strokeWidth={2.4} />
        </span>
    );
}

export type ModelCreditCost = {
    model: string;
    credits: number;
};

function modelCreditCost(modelCosts: ModelCreditCost[] | undefined, model: string) {
    return modelCosts?.find((item) => item.model === model)?.credits || 0;
}

export function requestCreditCost(options: { model: string; count?: string | number }) {
    const modelCosts = useConfigStore.getState().publicSettings?.modelChannel?.modelCosts;
    if (!modelCosts?.length) return 0;
    const count = Math.max(1, Math.floor(Math.abs(Number(options.count)) || 1));
    return modelCreditCost(modelCosts, options.model) * count;
}
