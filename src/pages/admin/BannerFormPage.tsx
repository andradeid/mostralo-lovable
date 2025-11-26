import { useParams } from "react-router-dom";
import { BannerForm } from "@/components/admin/BannerForm";

export default function BannerFormPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {id ? "Editar Banner" : "Novo Banner"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {id ? "Atualize as informações do banner" : "Crie um novo banner para sua loja"}
        </p>
      </div>

      <BannerForm bannerId={id} />
    </div>
  );
}
