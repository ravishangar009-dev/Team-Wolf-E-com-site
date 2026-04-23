import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Target, Dumbbell } from "lucide-react";

interface ExerciseCardProps {
  exercise: {
    id: string;
    name: string;
    video_url: string | null;
    targeted_muscles: string[] | null;
    workout_type: string;
    description: string | null;
  };
}

export const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-primary/10">
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden rounded-t-xl">
        {exercise.video_url ? (
          <div className="w-full h-full">
            {/* Simple placeholder for video, usually would be an iframe or video tag */}
            <iframe
              className="w-full h-full"
              src={exercise.video_url.includes("youtube.com") 
                ? exercise.video_url.replace("watch?v=", "embed/") 
                : exercise.video_url}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Video className="w-12 h-12 opacity-20" />
            <span className="text-sm">No video available</span>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold font-outfit">{exercise.name}</CardTitle>
          <Badge variant="outline" className="capitalize text-[10px]">
            {exercise.workout_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Target className="w-4 h-4" />
            Target Muscles:
          </div>
          <div className="flex flex-wrap gap-1">
            {exercise.targeted_muscles?.map((muscle) => (
              <Badge key={muscle} variant="secondary" className="bg-secondary/50 text-[10px]">
                {muscle}
              </Badge>
            ))}
            {(!exercise.targeted_muscles || exercise.targeted_muscles.length === 0) && (
              <span className="text-xs text-muted-foreground">Not specified</span>
            )}
          </div>
        </div>

        {exercise.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Dumbbell className="w-4 h-4" />
              Instructions:
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {exercise.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
