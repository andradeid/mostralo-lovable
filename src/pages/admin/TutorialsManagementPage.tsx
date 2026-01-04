import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Video, BarChart3 } from "lucide-react";
import { TutorialCategoriesTab } from "@/components/tutorials/admin/TutorialCategoriesTab";
import { TutorialVideosTab } from "@/components/tutorials/admin/TutorialVideosTab";
import { TutorialStatsTab } from "@/components/tutorials/admin/TutorialStatsTab";

export default function TutorialsManagementPage() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Tutoriais</h1>
        <p className="text-muted-foreground">
          Crie categorias, adicione vídeos do YouTube e acompanhe as estatísticas de visualização.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="categories" className="gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Tutoriais</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <TutorialCategoriesTab />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <TutorialVideosTab />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <TutorialStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
