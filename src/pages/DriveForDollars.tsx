import { useState, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { analyzePropertyImage } from "../lib/gemini";
import { useNavigate } from "react-router-dom";

export default function DriveForDollars() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addLead } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !address) {
      toast.error("Please provide both an image and an approximate address");
      return;
    }

    setIsAnalyzing(true);
    try {
      // preview is already data url
      const analysisJsonStr = await analyzePropertyImage(preview, address);
      
      const cleanJsonStr = analysisJsonStr.replace(/```json\n?|\n?```/g, "").trim();
      const data = JSON.parse(cleanJsonStr);

      await addLead({
         sellerName: "Unknown Owner (Needs Skiptrace)",
         phone: "",
         propertyAddress: address,
         askingPrice: null,
         motivation: data.distressSignals?.join(", ") || "Found via Drive for Dollars",
         status: "New Lead",
         leadSource: "Drive for Dollars",
         tags: ["drive-for-dollars", ...(data.tags || [])],
         notes: "AI Vision Analysis: " + (data.summary || "")
      });

      toast.success("Property analyzed and lead created!");
      navigate("/leads");
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Failed to analyze image. Ensure current Model supports vision.";
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10 w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Drive for Dollars</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vision Analysis</CardTitle>
          <CardDescription>Upload a photo of a distressed property and AI will automatically analyze distress signals to create a lead.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Property Address (Approximate)</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St..." />
          </div>

          <div className="grid gap-2">
            <Label>Property Photo</Label>
            <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
               {preview ? (
                 <img src={preview} alt="Preview" className="max-h-64 object-cover rounded-md shadow-sm" />
               ) : (
                 <>
                   <Camera className="w-10 h-10 text-slate-400 mb-2" />
                   <span className="text-sm font-medium text-slate-600">Tap to take photo or upload</span>
                   <span className="text-xs text-slate-500 mt-1">JPEG, PNG up to 10MB</span>
                 </>
               )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => { setFile(null); setPreview(null); }}>Clear Image</Button>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !preview || !address}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            Analyze Property
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
