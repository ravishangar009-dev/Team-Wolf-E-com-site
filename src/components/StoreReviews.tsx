import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile_name?: string;
}

interface StoreReviewsProps {
  storeId: string;
}

const StoreReviews = ({ storeId }: StoreReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, [storeId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profile names for reviewers
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);
      setReviews(
        data.map((r) => ({ ...r, profile_name: profileMap.get(r.user_id) || "Anonymous" }))
      );
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Please login to leave a review");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      store_id: storeId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });
    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setComment("");
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (!error) {
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-outfit">
          <MessageSquare className="w-5 h-5 text-primary" />
          Reviews & Comments
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} ({reviews.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Submit review */}
        {userId && (
          <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
            <p className="font-medium text-sm">Leave a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={submitting} size="sm">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-3 bg-secondary/30 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.profile_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {review.user_id === userId && (
                      <button onClick={() => handleDelete(review.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreReviews;
