"use client";

import ClaimAnonymousUser from "@/components/account/ClaimAnonymousUser";

/**
 * Same flow as the default anonymous user claim, but requests are sent only
 * when the onboarding flow is completed
 */
const ClaimStep = ({
  onClaimRequested,
  initialCode,
}: {
  onClaimRequested: () => void;
  initialCode?: string;
}) => {
  return (
    <ClaimAnonymousUser
      showHeader={false}
      onRequested={onClaimRequested}
      initialCode={initialCode}
    />
  );
};

export default ClaimStep;
