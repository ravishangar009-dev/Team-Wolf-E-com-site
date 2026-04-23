import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Dumbbell, Video, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface WorkoutExercise {
  id: string;
  name: string;
  video_url: string | null;
  targeted_muscles: string[] | null;
  workout_type: string;
  description: string | null;
  created_at: string;
}

const AdminWorkoutExercises = () => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    video_url: "",
    targeted_muscles: "",
    workout_type: "weight training",
    description: "",
  });

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_exercises")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      setExercises(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      video_url: "",
      targeted_muscles: "",
      workout_type: "weight training",
      description: "",
    });
    setEditingExercise(null);
  };

  const handleEdit = (exercise: WorkoutExercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      video_url: exercise.video_url || "",
      targeted_muscles: exercise.targeted_muscles?.join(", ") || "",
      workout_type: exercise.workout_type,
      description: exercise.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const musclesArray = formData.targeted_muscles
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m !== "");

    const exerciseData = {
      name: formData.name,
      video_url: formData.video_url || null,
      targeted_muscles: musclesArray,
      workout_type: formData.workout_type,
      description: formData.description || null,
    };

    if (editingExercise) {
      const { error } = await supabase.from("workout_exercises").update(exerciseData).eq("id", editingExercise.id);
      if (error) {
        toast.error("Failed to update exercise");
        return;
      }
      toast.success("Exercise updated successfully");
    } else {
      const { error } = await supabase.from("workout_exercises").insert(exerciseData);
      if (error) {
        toast.error("Failed to create exercise");
        return;
      }
      toast.success("Exercise created successfully");
    }

    setDialogOpen(false);
    resetForm();
    fetchExercises();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exercise?")) return;

    const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete exercise");
      return;
    }
    toast.success("Exercise deleted successfully");
    fetchExercises();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-primary" />
              Workout Exercises
            </h1>
            <p className="text-muted-foreground">Manage the exercise library for VIP users</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingExercise ? "Edit Exercise" : "Add New Exercise"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Exercise Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="video_url">Video URL (YouTube/MP4)</Label>
                  <div className="flex gap-2">
                    <Video className="w-5 h-5 text-muted-foreground self-center" />
                    <Input id="video_url" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="muscles">Targeted Muscles (comma separated)</Label>
                  <div className="flex gap-2">
                    <Target className="w-5 h-5 text-muted-foreground self-center" />
                    <Input id="muscles" value={formData.targeted_muscles} onChange={(e) => setFormData({ ...formData, targeted_muscles: e.target.value })} placeholder="e.g. Chest, Triceps" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Workout Type *</Label>
                  <Select value={formData.workout_type} onValueChange={(value) => setFormData({ ...formData, workout_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="weight training">Weight Training</SelectItem>
                      <SelectItem value="weight loss">Weight Loss</SelectItem>
                      <SelectItem value="weight gain">Weight Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <Button type="submit" className="w-full">{editingExercise ? "Update Exercise" : "Create Exercise"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading exercises...</div>
            ) : exercises.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exercises found. Add your first exercise!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Muscles</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {exercise.workout_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exercise.targeted_muscles?.map((muscle) => (
                            <Badge key={muscle} variant="secondary" className="text-[10px]">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exercise.video_url ? (
                          <a href={exercise.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Video className="w-4 h-4" /> Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">No video</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exercise)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exercise.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWorkoutExercises;
