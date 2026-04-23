import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutAssessment } from "@/components/workout/WorkoutAssessment";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { Loader2, Lock, Dumbbell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface WorkoutExercise {
  id: string;
  name: string;
  video_url: string | null;
  targeted_muscles: string[] | null;
  workout_type: string;
  description: string | null;
}

interface UserProfile {
  fitness_goal: string;
  assessment_completed: boolean;
}

const WorkoutVIP = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const checkAccessAndProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user has access
    const { data: access, error: accessError } = await supabase
      .from("user_workout_access")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (accessError || !access) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);

    // Check profile
    const { data: profileData } = await supabase
      .from("user_workout_profiles")
      .select("fitness_goal, assessment_completed")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setProfile(profileData);

    if (profileData?.assessment_completed) {
      // Fetch exercises based on goal
      const { data: exerciseData } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_type", profileData.fitness_goal)
        .order("name");
      
      setExercises(exerciseData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAccessAndProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Lock className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-outfit mb-4">VIP Access Required</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          This section is exclusive to our VIP members. Please contact support to upgrade your plan and unlock professional workout routines.
        </p>
        <Button onClick={() => navigate("/")} variant="outline" className="h-12 px-8">
          Back to Home
        </Button>
      </div>
    );
  }

  if (!profile?.assessment_completed) {
    return <WorkoutAssessment userId={user.id} onComplete={checkAccessAndProfile} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-primary/10 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-outfit font-bold mb-2 flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              Your Personalized Plan
            </h1>
            <p className="text-muted-foreground text-lg">
              Optimized for <span className="font-bold text-primary capitalize">{profile.fitness_goal}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Reset assessment
                if(confirm("Are you sure you want to retake the assessment?")) {
                  setProfile(null);
                }
              }}
              className="gap-2"
            >
              Retake Assessment
            </Button>
          </div>
        </div>
      </header>

      {/* Exercises Section */}
      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Dumbbell className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-outfit font-bold">Recommended Exercises</h2>
        </div>

        {exercises.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="max-w-md mx-auto">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No exercises found for your goal yet.</h3>
              <p className="text-muted-foreground">
                Our trainers are currently updating the library. Please check back soon or try changing your goal.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </main>

      {/* Footer / Contact Support */}
      <footer className="max-w-7xl mx-auto py-12 px-4 border-t mt-12 text-center">
        <p className="text-muted-foreground">
          Need help? <a href="#" className="text-primary hover:underline">Contact your personal trainer</a>
        </p>
      </footer>
    </div>
  );
};

export default WorkoutVIP;
