import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from "sonner";
import { analyzeDocumentText } from "../lib/gemini";
import Markdown from "react-markdown";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function Contracts() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
         const page = await pdf.getPage(i);
         const content = await page.getTextContent();
         const strings = content.items.map((item: any) => item.str);
         text += strings.join(" ") + "\n";
      }

      if (!text.trim()) {
         toast.error("Could not extract text from PDF. It might be scanned/image-based.");
         return;
      }

      toast.success("Text extracted. Analyzing contract...");
      const result = await analyzeDocumentText(text, "Wholesale Contract / HUD-1");
      setAnalysis(result);

    } catch (e) {
      console.error(e);
      toast.error("Failed to parse and analyze document.");
    } finally {
       setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10 w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Contract Parsing</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
               <CardTitle>Upload PDF</CardTitle>
               <CardDescription>Upload a wholesale contract, HUD-1, or title search to automatically identify financial terms and hidden risks.</CardDescription>
            </CardHeader>
            <CardContent>
                <div 
                   onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                   className={`border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center transition-colors ${!isAnalyzing ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'}`}
                >
                   {isAnalyzing ? (
                     <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                   ) : (
                     <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                   )}
                   <span className="text-sm font-medium text-slate-600 text-center">
                     {isAnalyzing ? "Reading Document..." : "Tap to upload PDF"}
                   </span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleUpload} />
            </CardContent>
        </Card>

        <Card className="md:col-span-2 min-h-[400px]">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                   <FileText className="w-5 h-5 text-blue-600" />
                   AI Contract Summary
               </CardTitle>
            </CardHeader>
            <CardContent>
                {analysis ? (
                   <div className="prose prose-sm max-w-none prose-blue">
                      <Markdown>{analysis}</Markdown>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                      <FileText className="w-12 h-12 mb-4 opacity-50" />
                      <p>Your contract analysis will appear here. The AI will flag contingencies, check financial terms, and highlight risks.</p>
                   </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
