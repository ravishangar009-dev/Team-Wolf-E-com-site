import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, Target, Trophy, Activity } from "lucide-react";

interface WorkoutAssessmentProps {
  userId: string;
  onComplete: () => void;
}

export const WorkoutAssessment = ({ userId, onComplete }: WorkoutAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fitness_goal: "weight training",
    experience_level: "beginner",
    health_issues: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("user_workout_profiles").upsert({
      user_id: userId,
      fitness_goal: formData.fitness_goal,
      experience_level: formData.experience_level,
      assessment_completed: true,
      answers: { health_issues: formData.health_issues },
    }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save your profile: " + error.message);
    } else {
      toast.success("Profile created! Your workout plan is ready.");
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-outfit font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Welcome to Wolf Workout
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's personalize your experience. Please answer a few questions.
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Fitness Assessment
          </CardTitle>
          <CardDescription>
            This helps us recommend the right exercises for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What is your primary fitness goal?
              </Label>
              <RadioGroup 
                value={formData.fitness_goal} 
                onValueChange={(v) => setFormData({ ...formData, fitness_goal: v })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {[
                  { value: "weight loss", label: "Weight Loss", description: "Burn fat and get lean" },
                  { value: "weight gain", label: "Weight Gain", description: "Build mass and size" },
                  { value: "weight training", label: "Weight Training", description: "Strength and muscle definition" },
                  { value: "cardio", label: "Cardio", description: "Endurance and heart health" },
                ].map((item) => (
                  <div key={item.value}>
                    <RadioGroupItem value={item.value} id={item.value} className="peer sr-only" />
                    <Label
                      htmlFor={item.value}
                      className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <span className="font-bold">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                What is your experience level?
              </Label>
              <RadioGroup 
                value={formData.experience_level} 
                onValueChange={(v) => setFormData({ ...formData, experience_level: v })}
                className="flex flex-col space-y-2"
              >
                {[
                  { value: "beginner", label: "Beginner", description: "0-6 months experience" },
                  { value: "intermediate", label: "Intermediate", description: "6-24 months experience" },
                  { value: "advanced", label: "Advanced", description: "2+ years experience" },
                ].map((item) => (
                  <div key={item.value} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent transition-colors">
                    <RadioGroupItem value={item.value} id={`exp-${item.value}`} />
                    <Label htmlFor={`exp-${item.value}`} className="flex-1 cursor-pointer">
                      <span className="font-semibold block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2" htmlFor="health">
                <Dumbbell className="w-5 h-5 text-primary" />
                Any health issues or injuries we should know about?
              </Label>
              <Textarea 
                id="health" 
                placeholder="e.g. Knee pain, asthma, etc. (Leave blank if none)" 
                value={formData.health_issues}
                onChange={(e) => setFormData({ ...formData, health_issues: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Saving..." : "Start My Journey"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
