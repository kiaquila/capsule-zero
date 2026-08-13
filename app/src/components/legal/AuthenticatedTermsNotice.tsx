import "server-only";

import type { ReactNode } from "react";
import { shouldShowTermsUpdateNotice } from "@/lib/legal/terms-boundary.mjs";
import { TermsUpdateNotice } from "./TermsUpdateNotice";

interface AuthenticatedTermsNoticeProps {
  children: ReactNode;
}

export function AuthenticatedTermsNotice({
  children,
}: AuthenticatedTermsNoticeProps) {
  const visible = shouldShowTermsUpdateNotice(new Date());

  return (
    <div className="authenticated-route">
      <TermsUpdateNotice visible={visible} />
      {children}
    </div>
  );
}
