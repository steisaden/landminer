import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

export function AddOpportunityDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addOpportunity } = useAppStore();

  const [propertyAddress, setPropertyAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyAddress) return;

    addOpportunity({
      propertyAddress,
      notes,
      opportunityScore: 75, // Default score for manually added opportunities
      source: "manual",
      tags: ["Vacant"],
    });
    
    toast.success(`Opportunity added successfully`);
    setOpen(false);
    
    setPropertyAddress("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Opportunity</DialogTitle>
          <DialogDescription>
            Add a property to keep an eye on before converting to a seller lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="oppAddress">Property Address *</Label>
            <Input
              id="oppAddress"
              required
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g. 456 Elm St, Springfield"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oppNotes">Notes</Label>
            <Textarea
              id="oppNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs repair, found on public records..."
            />
          </div>
          <div className="pt-2 flex justify-end">
            <Button type="submit">Save Opportunity</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
