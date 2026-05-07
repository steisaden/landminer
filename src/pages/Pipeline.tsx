import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { LeadStatus } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const PIPELINE_COLUMNS: LeadStatus[] = [
  "New Lead",
  "Contacted",
  "Follow-Up",
  "Appointment Set",
  "Offer Made",
  "Under Contract"
];

export default function Pipeline() {
  const { leads, updateLead } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as LeadStatus;
    updateLead(draggableId, { status: newStatus });
  };

  if (!isMounted) return null; // Avoid hydration mismatch on DND

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-80px)]">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Deal Pipeline</h1>
          <p className="text-sm text-slate-500">Use this board to move active leads between stages. Open the lead record for details.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-h-full items-start">
            {PIPELINE_COLUMNS.map((status) => {
              const columnLeads = leads.filter((l) => l.status === status);

              return (
                <div key={status} className="flex-shrink-0 w-80 bg-muted/40 rounded-lg border border-border flex flex-col max-h-full">
                  <div className="p-3 border-b flex items-center justify-between bg-card rounded-t-lg">
                    <h3 className="font-semibold text-sm">{status}</h3>
                    <Badge variant="secondary" className="rounded-full">{columnLeads.length}</Badge>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto min-h-[150px] space-y-3 ${
                          snapshot.isDraggingOver ? "bg-muted/60" : ""
                        }`}
                      >
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <Card className={`cursor-grab hover:border-primary/50 transition-colors ${snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm"}`}>
                                  <CardHeader className="p-3 pb-2">
                                    <CardTitle className="text-sm font-semibold flex justify-between">
                                      {lead.sellerName}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0">
                                    <p className="text-xs text-muted-foreground truncate mb-2">{lead.propertyAddress}</p>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                        {lead.askingPrice ? `$${lead.askingPrice.toLocaleString()}` : 'No price'}
                                      </span>
                                      <span className="text-slate-400">Pipeline card</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
