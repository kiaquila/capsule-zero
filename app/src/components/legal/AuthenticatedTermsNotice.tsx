import "server-only";

import type { ReactNode } from "react";
import {
  safetyPolicyEffectiveAt,
  shouldShowTermsUpdateNotice,
} from "@/lib/legal/terms-boundary.mjs";
import { TermsUpdateNotice } from "./TermsUpdateNotice";

interface AuthenticatedTermsNoticeProps {
  children: ReactNode;
}

export function AuthenticatedTermsNotice({
  children,
}: AuthenticatedTermsNoticeProps) {
  const serverNow = new Date();
  const visible = shouldShowTermsUpdateNotice(serverNow);

  return (
    <div className="authenticated-route">
      <TermsUpdateNotice
        effectiveAt={safetyPolicyEffectiveAt}
        serverNow={serverNow.toISOString()}
        visible={visible}
      />
      {children}
    </div>
  );
}
