import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id?: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile_name?: string;
}

interface ProductReviewsProps {
  productId: string;
  storeId: string;
}

const ProductReviews = ({ productId, storeId }: ProductReviewsProps) => {
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
  }, [productId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
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
    
    // We suppress the TS error for product_id assuming the user has run the migration!
    const { error } = await supabase.from("reviews").insert({
      store_id: storeId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
      // @ts-ignore
      product_id: productId, 
    });
    
    if (error) {
      toast.error("Failed to submit review");
      console.error(error);
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
    <div className="animate-fade-in mt-6 border-t border-border/50 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-outfit font-semibold text-lg flex items-center gap-2">
          Product Reviews
          <span className="text-sm font-normal text-muted-foreground ml-2 flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} ({reviews.length})
          </span>
        </h3>
      </div>
      
      <div className="space-y-6">
        {/* Submit review */}
        {userId ? (
          <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border/50">
            <p className="font-medium text-sm">Rate this product</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="focus:outline-none"
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
              placeholder="Tell us what you think..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSubmit} disabled={submitting} size="sm" className="w-full">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        ) : (
          <div className="text-sm text-center p-3 bg-secondary/30 rounded-lg text-muted-foreground">
            Please login to review this product.
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <p className="text-muted-foreground text-sm text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-2">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.map((review) => (
              <div key={review.id} className="p-3 bg-card border rounded-lg space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.profile_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/80">{review.comment}</p>
                )}
                {review.user_id === userId && (
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
