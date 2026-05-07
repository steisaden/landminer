import { useAppStore } from "../store/useAppStore";
import { format, isToday, isPast, parseISO } from "date-fns";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle2, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function FollowUps() {
  const { leads, completeFollowUp } = useAppStore();
  const navigate = useNavigate();

  const allFollowUps = leads.flatMap((lead) =>
    lead.followUps.map((fu) => ({ ...fu, lead }))
  );

  const pending = allFollowUps.filter((fu) => !fu.completed);
  const completed = allFollowUps.filter((fu) => fu.completed).sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

  const dueToday = pending.filter((fu) => isToday(parseISO(fu.dueDate)));
  const overdue = pending.filter((fu) => !isToday(parseISO(fu.dueDate)) && isPast(parseISO(fu.dueDate)));
  const upcoming = pending.filter((fu) => !isToday(parseISO(fu.dueDate)) && !isPast(parseISO(fu.dueDate))).sort((a,b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  const renderTask = (fu: typeof allFollowUps[0], type: 'today' | 'overdue' | 'upcoming' | 'completed') => (
    <div key={fu.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-bold text-slate-800">{fu.lead.sellerName}</span>
          {type === 'overdue' && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Overdue</span>
          )}
          {type === 'today' && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Today</span>
          )}
          {type === 'upcoming' && (
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{format(parseISO(fu.dueDate), "MMM d")}</span>
          )}
          {type === 'completed' && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Done</span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {fu.lead.propertyAddress} • {fu.lead.askingPrice ? `$${fu.lead.askingPrice.toLocaleString()}` : 'No Asking Price'}
        </p>
        {fu.notes && (
            <p className="text-xs text-slate-400 italic mt-2 bg-slate-50 p-2 rounded w-fit">"{fu.notes}"</p>
        )}
      </div>
      <div className="text-right flex items-center gap-3 w-full sm:w-auto justify-end">
        <Button variant="outline" size="sm" onClick={() => navigate(`/leads/${fu.lead.id}`)} className="text-xs font-bold uppercase rounded-full px-4 text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
          View Lead
        </Button>
        {type !== 'completed' && (
          <Button variant="outline" size="sm" onClick={() => completeFollowUp(fu.lead.id, fu.id)} className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 aspect-square">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-2 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Follow-Ups</h1>
          <p className="text-sm text-slate-500">Focus only on the tasks you need to clear.</p>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 shadow-sm p-1 rounded-lg mb-6">
          <TabsTrigger value="today" className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
            Due Today ({dueToday.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-md data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm">
            Overdue ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-md data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            Completed
          </TabsTrigger>
        </TabsList>
        <Card className="rounded-xl overflow-hidden border-slate-200 shadow-sm bg-white">
          <TabsContent value="today" className="m-0 border-0 outline-none">
            <div className="divide-y divide-slate-100 min-h-[400px]">
              {dueToday.length > 0 ? (
                dueToday.map(fu => renderTask(fu, 'today'))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p>No follow-ups due today. You're caught up!</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="overdue" className="m-0 border-0 outline-none">
            <div className="divide-y divide-slate-100 min-h-[400px]">
              {overdue.length > 0 ? (
                overdue.map(fu => renderTask(fu, 'overdue'))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                  <p>Great job! You have no overdue follow-ups.</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="upcoming" className="m-0 border-0 outline-none">
            <div className="divide-y divide-slate-100 min-h-[400px]">
              {upcoming.length > 0 ? (
                upcoming.map(fu => renderTask(fu, 'upcoming'))
              ) : (
                 <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p>No upcoming follow-ups scheduled.</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="m-0 border-0 outline-none">
            <div className="divide-y divide-slate-100 min-h-[400px]">
              {completed.length > 0 ? (
                completed.map(fu => renderTask(fu, 'completed'))
              ) : (
                 <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                  <p>No completed follow-ups yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
