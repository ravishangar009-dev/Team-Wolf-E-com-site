import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProductImageUploadProps {
  productId: string;
  currentImage: string | null;
  onUploadComplete: (url: string) => void;
}

export const ProductImageUpload = ({
  productId,
  currentImage,
  onUploadComplete,
}: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product_images")
        .upload(filePath, file);

      if (uploadError) {
        // Fallback for simple prompt usage: Instead of throwing a hard error if the bucket doesn't exist,
        // we can just prompt the user if they'd prefer to use an external URL. 
        // But throwing is standard so we'll throw.
        throw uploadError;
      }

      const { data } = supabase.storage.from("product_images").getPublicUrl(filePath);
      
      onUploadComplete(data.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error uploading image. (Have you created the product_images storage bucket locally/remotely?)");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentImage ? (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Product"
            className="w-32 h-32 object-cover rounded-lg border border-border bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => onUploadComplete("")}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-32 h-32 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
          <Upload className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      
      <div>
        <Button
          type="button"
          variant="outline"
          className="relative overflow-hidden w-32"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>Upload Image</>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            onChange={uploadImage}
            disabled={uploading}
          />
        </Button>
      </div>
    </div>
  );
};
