import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import { DocumentManager } from "../components/DocumentManager";
import { useState } from "react";

export default function Settings() {
  const { businessName, followUpStyle, cadence, setOnboardingData, focus, setAuth, isPro, apiKeys, setApiKeys, activeAiProvider, selectedModels, setSelectedModel } = useAppStore();
  const navigate = useNavigate();

  const [localKeys, setLocalKeys] = useState(apiKeys || {});

  const handleUpdateKey = (provider: string, value: string) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveKeys = async () => {
    await setApiKeys(localKeys);
    toast.success("API Keys saved successfully");
  };

  const modelOptions: Record<string, { label: string, value: string }[]> = {
    gemini: [
      { label: "Gemini 3 Flash", value: "gemini-3-flash-preview" },
      { label: "Gemini 3.1 Pro", value: "gemini-3.1-pro-preview" },
      { label: "Gemini 2.5 Flash Image", value: "gemini-2.5-flash-image" },
      { label: "Gemini 3.1 Flash Image", value: "gemini-3.1-flash-image-preview" },
    ],
    openai: [
      { label: "GPT-4o Mini", value: "gpt-4o-mini" },
      { label: "GPT-4o", value: "gpt-4o" },
    ],
    claude: [
      { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20240620" },
      { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
    ],
    ollama: [
      { label: "Llama 3 (8B)", value: "llama3" },
      { label: "Mistral", value: "mistral" }
    ],
    qwen: [
      { label: "Qwen Plus", value: "qwen-plus" },
      { label: "Qwen Max", value: "qwen-max" }
    ],
    opencode: [
      { label: "Meta Llama 3 8B Instruct", value: "meta-llama/Meta-Llama-3-8B-Instruct" },
      { label: "Mistral 7B Instruct v0.3", value: "mistralai/Mistral-7B-Instruct-v0.3" }
    ],
    openrouter: [
      { label: "OpenRouter Free Auto", value: "openrouter/free" },
      { label: "Qwen3 Coder Free", value: "qwen/qwen3-coder:free" },
      { label: "MiniMax M2.5 Free", value: "minimax/minimax-m2.5:free" },
      { label: "Elephant Alpha", value: "openrouter/elephant-alpha" },
      { label: "GPT OSS 120B Free", value: "openai/gpt-oss-120b:free" },
      { label: "Llama 3.3 70B Instruct", value: "meta-llama/llama-3.3-70b-instruct:free" }
    ]
  };

  const activeModelOptions = modelOptions[activeAiProvider] || [];
  const currentModel = selectedModels[activeAiProvider] || (activeModelOptions[0]?.value || "");

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-10">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-6">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-slate-500">Manage your CRM preferences</p>
        </div>
      </div>

      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Your company details for AI messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bname">Business Name</Label>
            <Input id="bname" defaultValue={businessName} onChange={(e) => setOnboardingData({ businessName: e.target.value, followUpStyle, cadence, focus, activeAiProvider }, true)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="focus">Wholesaling Focus</Label>
            <Select value={focus} onValueChange={(val) => setOnboardingData({ businessName, followUpStyle, cadence, focus: val, activeAiProvider }, true)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacant houses">Vacant houses</SelectItem>
                <SelectItem value="Tax delinquent">Tax delinquent</SelectItem>
                <SelectItem value="Probate">Probate</SelectItem>
                <SelectItem value="Tired landlords">Tired landlords</SelectItem>
                <SelectItem value="Driving for dollars">Driving for dollars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>Follow-Up Rules</CardTitle>
          <CardDescription>Defaults based on your onboarding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>AI Tone of Voice</Label>
            <Select value={followUpStyle} onValueChange={(val) => setOnboardingData({ businessName, followUpStyle: val, cadence, focus, activeAiProvider }, true)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Investor-style">Investor-style</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Default Cadence (Days)</Label>
            <Select value={cadence} onValueChange={(val) => setOnboardingData({ businessName, followUpStyle, cadence: val, focus, activeAiProvider }, true)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Active AI Provider</Label>
            <div className="flex gap-2">
              <Select value={activeAiProvider} onValueChange={(val) => setOnboardingData({ businessName, followUpStyle, cadence, focus, activeAiProvider: val }, true)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                  <SelectItem value="claude">Anthropic Claude</SelectItem>
                  <SelectItem value="ollama">Ollama (Local / Custom)</SelectItem>
                  <SelectItem value="qwen">Alibaba Qwen</SelectItem>
                  <SelectItem value="opencode">OpenCode</SelectItem>
                  <SelectItem value="openrouter">OpenRouter (Free Models)</SelectItem>
                </SelectContent>
              </Select>
              {activeModelOptions.length > 0 && (
                <Select value={currentModel} onValueChange={(val) => setSelectedModel(activeAiProvider, val)}>
                  <SelectTrigger className="flex-1 border-blue-200 bg-blue-50">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeModelOptions.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => toast.success("Rules updated")}>Save Rules</Button>
        </CardFooter>
      </Card>

      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>AI Provider API Keys</CardTitle>
          <CardDescription>Bring your own API keys for AI models (Gemini, OpenAI, Claude, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="key-gemini">Google Gemini API Key</Label>
            <Input id="key-gemini" type="password" value={localKeys?.gemini || ""} onChange={(e) => handleUpdateKey("gemini", e.target.value)} placeholder="AIzaSy..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-openai">OpenAI API Key</Label>
            <Input id="key-openai" type="password" value={localKeys?.openai || ""} onChange={(e) => handleUpdateKey("openai", e.target.value)} placeholder="sk-..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-claude">Anthropic Claude API Key</Label>
            <Input id="key-claude" type="password" value={localKeys?.claude || ""} onChange={(e) => handleUpdateKey("claude", e.target.value)} placeholder="sk-ant-..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-ollama">Ollama URL (Local / Hosted)</Label>
            <Input id="key-ollama" type="url" value={localKeys?.ollama || ""} onChange={(e) => handleUpdateKey("ollama", e.target.value)} placeholder="http://localhost:11434" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-qwen">Alibaba Qwen API Key</Label>
            <Input id="key-qwen" type="password" value={localKeys?.qwen || ""} onChange={(e) => handleUpdateKey("qwen", e.target.value)} placeholder="sk-..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-opencode">OpenCode API Key</Label>
            <Input id="key-opencode" type="password" value={localKeys?.opencode || ""} onChange={(e) => handleUpdateKey("opencode", e.target.value)} placeholder="sk-..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key-openrouter">OpenRouter API Key (For Free Models)</Label>
            <Input id="key-openrouter" type="password" value={localKeys?.openrouter || ""} onChange={(e) => handleUpdateKey("openrouter", e.target.value)} placeholder="sk-or-v1-..." />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveKeys}>Save API Keys</Button>
        </CardFooter>
      </Card>

      <Card className="shrink-0 relative overflow-hidden border-blue-100">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
           <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            {isPro ? "You are currently on the PRO Plan." : "Free Tier"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Plan Features:</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Unlimited active leads
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                {isPro ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                )}
                AI Follow-Up Text Generation
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Follow-up reminders & Pipeline view
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t pt-4">
          {isPro ? (
            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               PRO Plan Active
            </p>
          ) : (
            <div className="flex flex-col gap-2 w-full text-sm">
                <a href="https://buy.stripe.com/test_YOUR_LINK_HERE" target="_blank" rel="noreferrer" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      Upgrade to PRO ($29/mo)
                    </Button>
                </a>
                <p className="text-xs text-slate-500 text-center mt-2">
                   Developer Note: Update the href above with your real Stripe Payment Link. 
                   <button onClick={() => useAppStore.getState().setProStatus(true)} className="ml-1 underline text-blue-500">Simulate Upgrade</button>
                </p>
            </div>
          )}
        </CardFooter>
      </Card>

      <DocumentManager 
        entityId="account" 
        entityType="account" 
        title="Business Documents" 
        description="Upload standardized forms, assignment contracts, or proof of funds." 
      />

      <div className="mt-4">
        <Button variant="destructive" onClick={() => {
            setAuth(false, null);
            navigate('/login');
        }}>Log Out</Button>
      </div>
    </div>
  );
}
