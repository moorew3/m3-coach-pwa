import type { HealthMetrics } from "@/lib/store";

/**
 * Provider-neutral boundary for future standards-based or OS-authorized health sources.
 * No provider is exposed until it has a real implementation and user authorization.
 */
export interface WearableProvider {
  id: string;
  name: string;
  available(): Promise<boolean>;
  requestAccess(): Promise<boolean>;
  readWorkout(from: Date, to: Date): Promise<HealthMetrics | null>;
}

const providers: WearableProvider[] = [];

export function registerWearableProvider(provider: WearableProvider) {
  if (!providers.some((item) => item.id === provider.id)) providers.push(provider);
}

export async function availableWearableProviders(): Promise<WearableProvider[]> {
  const checks = await Promise.all(
    providers.map(async (provider) => ({ provider, ok: await provider.available() })),
  );
  return checks.filter((item) => item.ok).map((item) => item.provider);
}

export function manualHealthMetrics(
  values: Omit<HealthMetrics, "source" | "recordedAt">,
): HealthMetrics {
  return { ...values, source: "manual", recordedAt: new Date().toISOString() };
}