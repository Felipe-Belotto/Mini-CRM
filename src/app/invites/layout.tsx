import { InvitesHeader } from "./InvitesHeader";

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <InvitesHeader />
      {children}
    </div>
  );
}
