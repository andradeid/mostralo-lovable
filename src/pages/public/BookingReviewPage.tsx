import { useState } from "react";
import { useParams } from "react-router-dom";
import { Star, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReviewByToken, useSubmitReview } from "@/hooks/useBookingReview";
import { toast } from "sonner";

export default function BookingReviewPage() {
  const { token } = useParams<{ token: string }>();
  const { data: review, isLoading, error } = useReviewByToken(token);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link inválido</h2>
            <p className="text-muted-foreground">
              Este link de avaliação não existe ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(review.expires_at) < new Date();
  const alreadyReviewed = !!review.reviewed_at;

  if (isExpired && !alreadyReviewed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link expirado</h2>
            <p className="text-muted-foreground">
              O prazo para avaliar este atendimento expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyReviewed || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Obrigado pela avaliação!</h2>
            <p className="text-muted-foreground">
              Sua opinião é muito importante para nós.
            </p>
            {(review.rating || rating) && (
              <div className="flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= (review.rating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota");
      return;
    }

    try {
      await submitReview.mutateAsync({
        token: token!,
        rating,
        feedback: feedback.trim() || undefined,
        isPublic,
      });
      setSubmitted(true);
      toast.success("Avaliação enviada com sucesso!");
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
  };

  const professionalInitials = review.professional?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          {review.store?.logo_url && (
            <img
              src={review.store.logo_url}
              alt={review.store.name}
              className="h-12 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-xl font-semibold">Como foi seu atendimento?</h1>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info do atendimento */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-14 w-14">
              {review.professional?.photo_url && (
                <AvatarImage src={review.professional.photo_url} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {professionalInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{review.professional?.name}</p>
              <p className="text-sm text-muted-foreground">
                {review.booking?.service?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(review.booking?.booking_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Rating Stars */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Toque nas estrelas para dar sua nota
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm mt-2 text-muted-foreground">
                {rating === 1 && "Muito ruim"}
                {rating === 2 && "Ruim"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Bom"}
                {rating === 5 && "Excelente!"}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm">
              Deixe um comentário (opcional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="mt-2 resize-none"
              rows={4}
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="public" className="text-sm cursor-pointer">
              Permitir exibir publicamente
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
            className="w-full"
            size="lg"
          >
            {submitReview.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
