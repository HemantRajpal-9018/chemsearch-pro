import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

export default function Documents() {
  const [isDragging, setIsDragging] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/documents/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chemicals"] });
      toast({ title: "Upload successful", description: `Extracted ${data.extractedCount} chemical structures` });
    },
    onError: (e: Error) => {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chemicals"] });
      toast({ title: "Document deleted" });
    },
  });

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type === "application/pdf") {
        uploadMutation.mutate(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const pdfUrl = viewDoc
    ? `${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/documents/${viewDoc.id}/file`
    : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <FileText className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Documents</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          data-testid="upload-zone"
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">Drag & drop PDF files here</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? "Uploading..." : "Choose Files"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* Document list */}
        <div className="space-y-2" data-testid="document-list">
          {documents.map((doc) => (
            <Card key={doc.id} className="bg-card">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-12 bg-destructive/10 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{doc.originalName}</h3>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    {doc.pageCount && <span>{doc.pageCount} page{doc.pageCount > 1 ? "s" : ""}</span>}
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewDoc(doc)} data-testid={`button-view-${doc.id}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    data-testid={`button-delete-${doc.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {documents.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No documents uploaded</p>
              <p className="text-xs mt-1">Upload PDFs to extract chemical structures</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="text-sm">{viewDoc?.originalName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewDoc && (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
