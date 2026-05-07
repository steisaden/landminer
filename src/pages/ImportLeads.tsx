import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Papa from "papaparse";
import { scrubLeadsBatch } from "../lib/gemini";

export default function ImportLeads() {
  const { addLead } = useAppStore();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [useAI, setUseAI] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let count = 0;
        let toImport = [];
        
        for (const row of results.data as any[]) {
          // Identify columns, tolerating case/spacing variations
          const sellerName = row["Name"] || row["Seller Name"] || row["Seller"] || "Unknown Seller";
          const phone = row["Phone"] || row["Phone Number"] || "";
          const propertyAddress = row["Property Address"] || row["Address"] || row["Property"] || "";
          const askingPriceRaw = row["Asking Price"] || row["Price"] || row["Asking"];
          const motivation = row["Motivation"] || row["Notes"] || "Imported from CSV";
          
          let askingPrice = null;
          if (askingPriceRaw) {
              const parsed = Number(askingPriceRaw.toString().replace(/[^0-9.-]+/g,""));
              if (!isNaN(parsed)) askingPrice = parsed;
          }

          const tags = [];
          if (!sellerName || !phone || sellerName === "Unknown Seller") {
              tags.push("Needs Skiptrace");
          }

          if (sellerName || phone || propertyAddress) {
             toImport.push({
                sellerName,
                phone,
                propertyAddress,
                askingPrice,
                motivation,
                leadSource: "CSV Import",
                status: "New Lead",
                notes: "",
                tags: tags,
             });
          }
        }
        
        if (useAI) {
           toast.loading("Scrubbing with AI... This may take a while.", { id: "ai-scrub" });
           const batchSize = 10;
           for(let i = 0; i < toImport.length; i += batchSize) {
               const chunk = toImport.slice(i, i + batchSize);
               const scoredChunk = await scrubLeadsBatch(chunk);
               for (const lead of scoredChunk) {
                  await addLead(lead);
                  count++;
               }
           }
           toast.dismiss("ai-scrub");
        } else {
           for (const lead of toImport) {
              await addLead(lead);
              count++;
           }
        }
        
        setImportedCount(count);
        setIsUploading(false);
        setIsDone(true);
        toast.success(`Successfully imported ${count} leads!`);
      },
      error: (error) => {
        console.error(error);
        setIsUploading(false);
        toast.error("Failed to parse CSV file.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-2 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Import Leads</h1>
          <p className="text-sm text-slate-500">Upload your list of sellers to get started.</p>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden border-slate-200 shadow-sm bg-white p-8">
        {!isDone ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50 transition-colors hover:bg-slate-100 hover:border-blue-400">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-lg font-bold text-slate-800">Processing CSV...</h3>
                <p className="text-sm text-slate-500 mt-2">Mapping columns and importing leads.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Upload your CSV</h3>
                <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm">
                  Make sure your file includes columns for Name, Phone, and Property Address. Motivation and Price are optional.
                </p>
                <div className="relative mb-6">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleUpload}
                  />
                  <Button className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 pointer-events-none relative z-0">
                    Select File & Upload
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 pt-4 border-t border-slate-200 w-full justify-center">
                  <input type="checkbox" id="ai-scrub" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                  <label htmlFor="ai-scrub" className="text-sm font-medium">Bulk AI Scrub & Score (Requires API Key)</label>
                </div>
              </>
            )}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Import Complete!</h3>
            <p className="text-sm text-slate-500 mt-2 mb-6">
              {importedCount} leads have been added to the New Lead stage. They are ready to be worked.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsDone(false)}>Upload Another</Button>
              <Button onClick={() => navigate('/leads')} className="bg-blue-600 hover:bg-blue-700">View Leads</Button>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
