import { MostraloPlay } from "@/components/mostralo-play/MostraloPlay";

/** Mostralo Play (prévia): por enquanto só o administrador master (rota protegida por papel). */
export default function MostraloPlayPage() {
  return (
    <div style={{ height: "100vh" }}>
      <MostraloPlay />
    </div>
  );
}
