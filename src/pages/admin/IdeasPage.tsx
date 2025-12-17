import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Lightbulb, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  MapPin,
  Target,
  BarChart3,
  Wrench,
  Calendar,
  Scale,
  ArrowRight
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ideasData, statusConfig, priorityConfig, type Idea } from "@/data/ideasData";

export default function IdeasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<number[]>([1]);

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredIdeas = ideasData.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || idea.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const renderIdeaContent = (idea: Idea) => (
    <CardContent className="pt-0 space-y-6">
      <p className="text-muted-foreground">{idea.description}</p>

      {idea.context && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>📍 Contexto Atual</span>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm whitespace-pre-line">{idea.context}</p>
            </div>
          </div>
        </>
      )}

      {idea.problem && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4 text-orange-500" />
            <span>🎯 Problema / Oportunidade</span>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm whitespace-pre-line">{idea.problem}</p>
          </div>
        </div>
      )}

      {idea.marketAnalysis && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="w-4 h-4 text-green-500" />
            <span>{idea.marketAnalysis.title}</span>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <ul className="text-sm space-y-2">
              {idea.marketAnalysis.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">💰</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {idea.technicalDetails && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="w-4 h-4 text-purple-500" />
            <span>{idea.technicalDetails.title}</span>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <ul className="text-sm space-y-2">
              {idea.technicalDetails.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span className="font-mono text-xs">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {idea.phases && idea.phases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-cyan-500" />
            <span>📅 Fases de Implementação</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {idea.phases.map((phase, idx) => (
              <Card key={idx} className="bg-cyan-500/5 border-cyan-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                      {idx + 1}
                    </Badge>
                    <CardTitle className="text-sm">{phase.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{phase.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs space-y-1">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {idea.legalConsiderations && idea.legalConsiderations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Scale className="w-4 h-4 text-amber-500" />
            <span>⚖️ Considerações Legais/Regulatórias</span>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ul className="text-sm space-y-2">
              {idea.legalConsiderations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {idea.options && idea.options.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">🔀 Comparativo de Modelos/Opções</p>
          <div className="grid md:grid-cols-2 gap-4">
            {idea.options.map((option, idx) => (
              <Card key={idx} className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{option.name}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      ✅ Prós
                    </p>
                    <ul className="text-sm space-y-1">
                      {option.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                      ❌ Contras
                    </p>
                    <ul className="text-sm space-y-1">
                      {option.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {idea.recommendation && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">
            💡 Recomendação
          </p>
          <p className="text-sm whitespace-pre-line">{idea.recommendation}</p>
        </div>
      )}

      {idea.nextSteps && idea.nextSteps.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">📋 Próximos Passos</p>
          <ul className="space-y-1">
            {idea.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">
                  {step.startsWith('✓') ? '✓' : idea.status === 'completed' ? '✓' : '□'}
                </span>
                <span className={step.startsWith('✓') || idea.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                  {step.replace(/^[✓□]\s*/, '')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Ideias e Funcionalidades Futuras
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro de ideias para evolução do sistema Mostralo ({ideasData.length} ideias)
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ideias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="idea">💡 Ideia</SelectItem>
                  <SelectItem value="analyzing">🔍 Em Análise</SelectItem>
                  <SelectItem value="development">🚧 Em Dev</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                  <SelectItem value="discarded">❌ Descartado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredIdeas.map((idea) => (
          <Collapsible 
            key={idea.id} 
            open={expandedIds.includes(idea.id)}
            onOpenChange={() => toggleExpanded(idea.id)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <Badge className={statusConfig[idea.status].color}>
                          {statusConfig[idea.status].label}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-4">
                        <span className={priorityConfig[idea.priority].color}>
                          Prioridade: {priorityConfig[idea.priority].label}
                        </span>
                        <span className="text-xs">{idea.createdAt}</span>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedIds.includes(idea.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {renderIdeaContent(idea)}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {filteredIdeas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ideia encontrada com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
