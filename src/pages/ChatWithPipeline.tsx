import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { askPipeline } from "../lib/gemini";
import Markdown from "react-markdown";

export default function ChatWithPipeline() {
  const { leads, opportunities } = useAppStore();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
    setIsTyping(true);

    try {
      // Basic RAG: pass all leads/opportunities into context if not too large, or rely on client-side search indexing in a real app
      // Here we serialize the list directly since many models have 128k+ context
      const context = JSON.stringify({
         totalLeads: leads.length,
         leads: leads.map(l => ({ name: l.sellerName, address: l.propertyAddress, price: l.askingPrice, motivation: l.motivation, status: l.status })),
         opportunities: opportunities.map(o => ({ address: o.propertyAddress, score: o.opportunityScore }))
      });
      
      const response = await askPipeline(userMsg, context);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to query pipeline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-slate-100 flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Chat with Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>Ask anything about your leads.</p>
              <p className="text-sm">"Which leads in NYC have high motivation?"</p>
              <p className="text-sm">"Summarize the distressed properties in my inbox."</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-4 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-slate-100 text-slate-800 rounded-lg p-4 flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> Thinking...
               </div>
             </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 p-4 flex-shrink-0 gap-2">
          <Input 
             value={query}
             onChange={e => setQuery(e.target.value)}
             onKeyDown={e => e.key === "Enter" && handleSend()}
             placeholder="Search leads, find motivations, ask about properties..."
             className="flex-1"
          />
          <Button onClick={handleSend} disabled={isTyping || !query.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
