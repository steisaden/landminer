import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { generateFollowUpMessage, generateDealSummary } from "../lib/gemini";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { EditLeadDialog } from "../components/EditLeadDialog";
import { DocumentManager } from "../components/DocumentManager";
import { ArrowLeft, Sparkles, CalendarPlus, Trash2, Phone, MessageSquare, Voicemail, XCircle, Building, MapPin, Zap } from "lucide-react";
import { LeadStatus } from "../types";
import { format, parseISO } from "date-fns";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, opportunities, updateLead, deleteLead, addActivity } = useAppStore();
  
  const lead = leads.find((l) => l.id === id);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [dealSummary, setDealSummary] = useState("");

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">Lead Not Found</h2>
        <Button variant="link" onClick={() => navigate("/leads")}>Back to Leads</Button>
      </div>
    );
  }

  const handleUpdate = (field: keyof typeof lead, value: any) => {
    updateLead(lead.id, { [field]: value });
  };

  const handleQuickAction = (actionText: string, type: import("../types").ActivityType) => {
    addActivity(lead.id, type, actionText);
    toast.success(`Logged: ${actionText}`);
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addActivity(lead.id, "note", noteContent);
    setNoteContent("");
    toast.success("Note added");
  };

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    setGeneratedMessage("");
    try {
      const msg = await generateFollowUpMessage(
        lead.sellerName, 
        lead.motivation, 
        lead.propertyAddress, 
        lead.askingPrice,
        useAppStore.getState().businessName,
        useAppStore.getState().followUpStyle,
        lead.notes
      );
      setGeneratedMessage(msg);
      addActivity(lead.id, "text", "AI Message Generated");
      toast.success("Message generated successfully");
    } catch (error) {
      toast.error("Failed to generate message");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarizeDeal = async () => {
    setIsSummarizing(true);
    setDealSummary("");
    try {
      const summary = await generateDealSummary(
        lead.sellerName,
        lead.motivation,
        lead.propertyAddress,
        lead.askingPrice,
        lead.tags
      );
      setDealSummary(summary);
      addActivity(lead.id, "note", "AI Deal Summary Generated");
      toast.success("Summary generated successfully");
    } catch (error) {
       toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };


  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
               <h1 className="text-xl font-bold tracking-tight">{lead.sellerName}</h1>
               {lead.tags && lead.tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 border-slate-200">
                     {t}
                  </Badge>
               ))}
            </div>
            <p className="text-sm text-slate-500">{lead.propertyAddress}</p>
          </div>
          <Badge variant={lead.status === "Dead Lead" ? "destructive" : "default"} className="text-sm px-3 py-1 ml-4 shadow-sm">
            {lead.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <EditLeadDialog lead={lead} />
          <Button variant="destructive" size="icon" onClick={() => {
            if (confirm("Are you sure you want to delete this lead?")) {
                deleteLead(lead.id);
                navigate("/leads");
            }
        }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column - Details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={lead.status} onValueChange={(v) => handleUpdate("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                    <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                    <SelectItem value="Offer Made">Offer Made</SelectItem>
                    <SelectItem value="Under Contract">Under Contract</SelectItem>
                    <SelectItem value="Dead Lead">Dead Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lead.phone}</span>
                  <a href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`} className="ml-auto">
                    <Button variant="outline" size="sm" className="h-7 px-2">
                      <Phone className="w-3 h-3 mr-1" /> Call
                    </Button>
                  </a>
                  <a href={`sms:${lead.phone.replace(/[^0-9+]/g, "")}`}>
                    <Button variant="outline" size="sm" className="h-7 px-2">
                       <MessageSquare className="w-3 h-3 mr-1" /> Text
                    </Button>
                  </a>
                  <Button variant="secondary" size="sm" className="h-7 px-2 ml-auto" onClick={() => window.open(`https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.sellerName)}&streetaddress=${encodeURIComponent(lead.propertyAddress)}`, '_blank')}>
                    <Sparkles className="w-3 h-3 mr-1" /> Skip Trace
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Property Address</Label>
                <span className="font-medium">{lead.propertyAddress}</span>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Asking Price ($)</Label>
                <span className="font-medium">{lead.askingPrice ? `$${lead.askingPrice.toLocaleString()}` : "Not Set"}</span>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="motivation">Motivation & Situation</Label>
                <Textarea 
                  id="motivation" 
                  value={lead.motivation} 
                  onChange={(e) => handleUpdate("motivation", e.target.value)} 
                  placeholder="Why are they selling? E.g., inherited, tired landlord, repairs needed..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Log touches, add notes, and view history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <Textarea 
                  placeholder="Add a custom note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Button size="sm" variant="outline" className="hidden sm:flex gap-2" onClick={() => handleQuickAction("Called (Spoke to seller)", "call")}>
                      <Phone className="w-4 h-4 text-blue-500" /> Log Call
                    </Button>
                    <Button size="sm" variant="outline" className="hidden sm:flex gap-2" onClick={() => handleQuickAction("Left Voicemail", "call")}>
                      <Voicemail className="w-4 h-4 text-purple-500" /> Log Voicemail
                    </Button>
                    <Button size="sm" variant="outline" className="hidden sm:flex gap-2" onClick={() => handleQuickAction("Texted", "text")}>
                      <MessageSquare className="w-4 h-4 text-green-500" /> Log Text
                    </Button>
                  </div>
                  <Button size="sm" onClick={handleAddNote}>Add Note</Button>
                </div>
              </div>

              <div className="space-y-0 relative border-l-2 border-slate-100 ml-4 pt-1 mt-6">
                {(!lead.activities || lead.activities.length === 0) ? (
                  <p className="text-sm text-slate-500 italic pl-6 pb-4">No activity logged yet.</p>
                ) : (
                  lead.activities.map((act) => (
                    <div key={act.id} className="flex gap-4 relative pb-6 pl-6 last:pb-2">
                      <div className="absolute -left-[17px] top-0 rounded-full p-[6px] bg-white border border-slate-200 shadow-sm z-10 w-8 h-8 flex items-center justify-center">
                        {act.type === "note" && <div className="h-2 w-2 rounded-full bg-slate-400" />}
                        {act.type === "call" && <Phone className="w-3.5 h-3.5 text-blue-500" />}
                        {act.type === "text" && <MessageSquare className="w-3.5 h-3.5 text-green-500" />}
                        {act.type === "status_change" && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                        {act.type === "meeting" && <CalendarPlus className="w-3.5 h-3.5 text-purple-500" />}
                      </div>
                      <div className="flex flex-col gap-1 flex-1 pb-1 mt-[2px]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 capitalize">{act.type.replace("_", " ")}</span>
                          <span className="text-xs text-slate-400">{format(parseISO(act.timestamp), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{act.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl overflow-hidden border border-slate-200 bg-white">
            <CardHeader className="p-6 pb-4 bg-slate-50 border-b">
              <CardTitle className="flex items-center justify-between text-lg text-slate-800 font-bold">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  AI Assistant
                </span>
                {!useAppStore.getState().isPro && (
                   <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium">PRO FEATURE</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Deal Summary Section */}
              <div className="space-y-3 border-b pb-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">Deal Summary</h4>
                 </div>
                 {dealSummary ? (
                   <div className="bg-amber-50/50 rounded-lg p-3 text-sm text-amber-900 border border-amber-100/50 leading-relaxed">
                     {dealSummary}
                   </div>
                 ) : null}
                 <Button 
                  onClick={useAppStore.getState().isPro ? handleSummarizeDeal : () => navigate("/settings")} 
                  disabled={isSummarizing && useAppStore.getState().isPro} 
                  variant="outline"
                  className="w-full bg-slate-50 hover:bg-slate-100 h-9"
                 >
                  {isSummarizing ? "Summarizing..." : "Summarize Deal"}
                 </Button>
              </div>

              {/* Message Generator Section */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">Follow-Up Text</h4>
                 </div>
              {generatedMessage ? (
                <div className="bg-blue-50 focus-within:ring-1 rounded-lg p-4 text-sm italic border border-blue-100 leading-relaxed relative text-blue-900">
                  "{generatedMessage}"
                  <div className="flex gap-2 w-full mt-3 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:bg-blue-100/50 h-8 font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMessage);
                        toast.success("Copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                    <a href={`sms:${lead.phone.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(generatedMessage)}`}>
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm h-8">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Send
                      </Button>
                    </a>
                  </div>
                </div>
              ) : null}
              <Button 
                onClick={useAppStore.getState().isPro ? handleGenerateMessage : () => navigate("/settings")} 
                disabled={isGenerating && useAppStore.getState().isPro} 
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors h-10 shadow-sm"
              >
                {!useAppStore.getState().isPro ? "Upgrade to PRO" : isGenerating ? "Generating..." : "Generate Text Message"}
              </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Nearby Deals & Follow-Up Shortcut */}
        <div className="flex flex-col gap-6">

          <Card className="border-emerald-200 shadow-sm bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-emerald-600" /> Nearby Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-sm text-emerald-700/70 p-3 bg-white rounded-lg border border-emerald-100 flex flex-col items-center justify-center text-center">
                   <MapPin className="w-6 h-6 text-emerald-300 mb-2" />
                   No nearby properties found. Import deals or check the map.
                   <Link to="/map" className="mt-2 text-emerald-600 underline font-medium text-xs">View Map</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.slice(0, 3).map(opp => (
                     <div key={opp.id} className="bg-white p-3 border border-emerald-100 rounded-lg hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => navigate('/opportunities')}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-800 truncate pr-2">{opp.propertyAddress}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 shrink-0 text-[10px] px-1.5 py-0">Score: {opp.opportunityScore}</Badge>
                        </div>
                        {opp.tags && opp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                             {opp.tags.slice(0, 2).map((t, idx) => (
                               <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{t}</span>
                             ))}
                             {opp.tags.length > 2 && <span className="text-[10px] text-slate-400">+{opp.tags.length - 2}</span>}
                          </div>
                        )}
                     </div>
                  ))}
                  <Button variant="link" className="w-full text-emerald-600 h-8" onClick={() => {
                     if (lead.lat && lead.lng) {
                       navigate(`/map?lat=${lead.lat}&lng=${lead.lng}&radius=5`);
                     } else {
                       navigate('/map');
                     }
                  }}>
                    View Deals on Map
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 flex items-center gap-2 text-lg">
                <CalendarPlus className="w-5 h-5 text-blue-600" /> Follow-Up Queue
              </CardTitle>
              <CardDescription>
                Manage reminders in one place instead of splitting them across pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                {lead.followUps.filter(f => !f.completed).length === 0
                  ? "No active reminders for this lead."
                  : `${lead.followUps.filter(f => !f.completed).length} active reminder${lead.followUps.filter(f => !f.completed).length === 1 ? "" : "s"} on the canonical Follow-Ups page.`}
              </div>
              <Link to="/follow-ups" className="inline-flex w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Open Follow-Ups
                </Button>
              </Link>
            </CardContent>
          </Card>

          <DocumentManager 
            entityId={lead.id} 
            entityType="lead" 
            title="Lead Documents" 
            description="Contracts, photos, addendums." 
          />
</div>
      </div>
    </div>
  );
}
