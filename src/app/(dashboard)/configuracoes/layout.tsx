import { redirect } from "next/navigation";
import { ConfiguracoesHeader } from "./ConfiguracoesHeader";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <ConfiguracoesHeader />
      {children}
    </div>
  );
}
