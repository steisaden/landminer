import { useState, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { AppDocument } from "../types";
import { Paperclip, Trash2, FileText, Download, UploadCloud, Loader2, FileImage, File } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DocumentManagerProps {
  entityId: string;
  entityType: "lead" | "account";
  title?: string;
  description?: string;
}

export function DocumentManager({ entityId, entityType, title = "Documents", description = "Upload and manage files." }: DocumentManagerProps) {
  const { documents, addDocument, deleteDocument } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const entityDocs = documents.filter(d => d.entityId === entityId && d.entityType === entityType)
                              .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload
    setIsUploading(true);
    
    // In a real app we'd upload to Firebase Storage
    // Here we'll just mock the upload delay and save a fake URL
    setTimeout(async () => {
      try {
        await addDocument({
          entityId,
          entityType,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          fileUrl: URL.createObjectURL(file), // Local object URL for demo purposes
        });
        toast.success("Document uploaded successfully");
      } catch (err) {
        toast.error("Failed to upload document");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }, 1500);
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-b-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-slate-400" />
            {title}
          </CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <UploadCloud className="w-4 h-4 text-slate-500" />}
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {entityDocs.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 m-4 rounded-xl border-slate-200 bg-slate-50">
             <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
             <p className="text-sm font-medium text-slate-600">No documents yet</p>
             <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload contracts, photos, or addendums here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex flex-col">
            {entityDocs.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="bg-white border rounded-xl p-2 shadow-sm shrink-0">
                  {getFileIcon(doc.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{formatFileSize(doc.sizeBytes)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this document?")) {
                        deleteDocument(doc.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
