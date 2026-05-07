import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { leads } = useAppStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = query
    ? leads.filter(l => 
        l.sellerName.toLowerCase().includes(query.toLowerCase()) || 
        l.phone.includes(query) ||
        l.propertyAddress.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="relative w-full max-w-sm mr-4" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Global search (name, phone...)"
          className="pl-9 bg-slate-100 border-transparent focus-visible:ring-blue-500 rounded-full focus:bg-white transition-colors"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
          {results.length > 0 ? (
            <div className="p-2 flex flex-col gap-1">
              {results.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    navigate(`/leads/${lead.id}`);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex flex-col items-start gap-1"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-slate-900">{lead.sellerName}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{lead.status}</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {lead.phone} • {lead.propertyAddress}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-500 text-center">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
