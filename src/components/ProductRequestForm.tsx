import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const requestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(10, "Valid phone number required").max(15),
  message: z.string().trim().min(5, "Please leave some feedback").max(500),
});

interface ProductRequestFormProps {
  storeId?: string;
  storeName?: string;
}

const ProductRequestForm = ({ storeId, storeName }: ProductRequestFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = requestSchema.safeParse({ name, phone, message });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("product_requests").insert({
        customer_name: name,
        customer_phone: phone,
        product_description: message,
        store_id: storeId || null,
      });

      if (dbError) throw dbError;

      // Send to WhatsApp and email via edge function
      const { error: fnError } = await supabase.functions.invoke("send-product-request", {
        body: {
          customerName: name,
          customerPhone: phone,
          productDescription: message,
          storeName: storeName || "General Request",
        },
      });

      if (fnError) {
        console.error("Edge function error:", fnError);
        // Still show success since DB insert worked
      }

      toast.success("Thank you! Your feedback has been sent successfully.");
      setName("");
      setPhone("");
      setMessage("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="font-outfit font-semibold text-lg mb-1">Have Feedback or Suggestions?</h3>
          <p className="text-sm text-muted-foreground">
            We value your thoughts! Click here to share your feedback with us.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 shadow-lg animate-scale-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-outfit">
          <MessageCircle className="w-5 h-5 text-primary" />
          Customer Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
              maxLength={100}
            />
          </div>
          <div>
            <Input
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-background"
              maxLength={15}
            />
          </div>
          <div>
            <Textarea
              placeholder="Share your experience or suggestions with us..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] bg-background resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {message.length}/500
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Feedback
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductRequestForm;