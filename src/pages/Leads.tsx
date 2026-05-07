import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Plus, Filter, Download } from "lucide-react";
import { LeadStatus } from "../types";
import { format, parseISO, isPast, isToday } from "date-fns";
import { AddLeadDialog } from "../components/AddLeadDialog";
import Papa from "papaparse";

const statusColors: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Contacted": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Follow-Up": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Appointment Set": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Offer Made": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "Under Contract": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Dead Lead": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function Leads() {
  const { leads, addLead } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");
  const [quickFilter, setQuickFilter] = useState("All");

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.sellerName.toLowerCase().includes(search.toLowerCase()) || 
                          lead.propertyAddress.toLowerCase().includes(search.toLowerCase()) ||
                          lead.phone.includes(search);
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
    
    let matchesQuick = true;
    if (quickFilter === "Hot") {
      matchesQuick = lead.motivation.toLowerCase().includes("high") || lead.motivation.toLowerCase().includes("must sell");
    } else if (quickFilter === "FollowUpDue") {
      matchesQuick = lead.followUps.some(fu => !fu.completed && (isPast(parseISO(fu.dueDate)) || isToday(parseISO(fu.dueDate))));
    }

    return matchesSearch && matchesStatus && matchesQuick;
  }).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

  const handleExportCSV = () => {
    const csvData = filteredLeads.map((lead) => ({
      "Seller Name": lead.sellerName,
      "Phone": lead.phone,
      "Property Address": lead.propertyAddress,
      "Status": lead.status,
      "Asking Price": lead.askingPrice || "",
      "Motivation": lead.motivation,
      "Date Added": format(parseISO(lead.createdAt), "yyyy-MM-dd"),
    }));

    const csvStr = Papa.unparse(csvData);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Leads_Export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-6 flex-shrink-0">
        <h1 className="text-xl font-bold">Lead Inbox</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="text-sm border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <AddLeadDialog>
            <Button className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </AddLeadDialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search name, phone, or address..."
            className="pl-9 border-slate-200 focus-visible:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as LeadStatus | "All")}>
            <SelectTrigger className="border-slate-200 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
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
        <div className="w-[180px]">
          <Select value={quickFilter} onValueChange={setQuickFilter}>
            <SelectTrigger className="border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-slate-400" />
                <SelectValue placeholder="Quick Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">No Quick Filter</SelectItem>
              <SelectItem value="Hot">Hot Leads (High Motivation)</SelectItem>
              <SelectItem value="FollowUpDue">Follow-up Due / Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Seller</TableHead>
              <TableHead className="font-semibold text-slate-600">Property</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600">Motivation</TableHead>
              <TableHead className="font-semibold text-slate-600">Added</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-800">
                  {lead.sellerName}
                  <div className="text-xs text-slate-500 font-normal mt-0.5">{lead.phone || "No Phone"}</div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-slate-600">{lead.propertyAddress}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[lead.status]}`}>
                    {lead.status}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-slate-500 text-sm">
                  {lead.motivation || "-"}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">{format(parseISO(lead.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/leads/${lead.id}`)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold px-3">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No leads found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
