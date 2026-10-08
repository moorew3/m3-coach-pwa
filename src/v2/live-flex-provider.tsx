import { useEffect, useState } from "react";
import type { FlexPresenceState } from "@/v2/flex-presence";
import { DidFlexAvatar } from "@/v2/did-flex-avatar";
import { LiveFlexAvatar } from "@/v2/live-flex-avatar";

type LiveFlexConfig = {
  provider: "did" | "liveavatar" | "none";
  did: {
    configured: boolean;
    agentId: string | null;
    clientKey: string | null;
  };
  liveavatar: {
    configured: boolean;
  };
  marcusTts: {
    configured: boolean;
    voiceId: string;
  };
};

export function LiveFlexProvider({
  presence,
  visible,
}: {
  presence: FlexPresenceState;
  visible: boolean;
}) {
  const [config, setConfig] = useState<LiveFlexConfig | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/public/live-flex-config", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Live Flex configuration check failed.");
        return response.json() as Promise<LiveFlexConfig>;
      })
      .then((next) => {
        if (alive) setConfig(next);
      })
      .catch(() => {
        if (alive) setConfig(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (
    config?.provider === "did" &&
    config.did.configured &&
    config.marcusTts.configured &&
    config.did.agentId &&
    config.did.clientKey
  ) {
    return (
      <DidFlexAvatar
        config={{
          agentId: config.did.agentId,
          clientKey: config.did.clientKey,
        }}
        presence={presence}
        visible={visible}
      />
    );
  }

  if (config?.provider === "liveavatar" && config.liveavatar.configured) {
    return <LiveFlexAvatar presence={presence} visible={visible} />;
  }

  return null;
}
