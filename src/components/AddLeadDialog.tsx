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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LeadStatus } from "../types";
import { toast } from "sonner";
import { LeadCoreFields } from "./leads/LeadCoreFields";

interface AddLeadDialogProps {
  children: React.ReactNode;
}

export function AddLeadDialog({ children }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const { addLead } = useAppStore();

  const [formData, setFormData] = useState({
    sellerName: "",
    phone: "",
    propertyAddress: "",
    askingPrice: "",
    motivation: "",
    leadSource: "Manual",
    status: "New Lead" as LeadStatus,
    notes: "",
    tags: [] as string[],
  });

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sellerName) return;

    addLead({
      sellerName: formData.sellerName,
      phone: formData.phone,
      propertyAddress: formData.propertyAddress,
      askingPrice: formData.askingPrice ? Number(formData.askingPrice) : null,
      motivation: formData.motivation,
      leadSource: formData.leadSource,
      status: formData.status,
      notes: formData.notes,
      tags: formData.tags,
    });

    toast.success(`${formData.sellerName} added successfully`);
    setOpen(false);

    setFormData({
      sellerName: "",
      phone: "",
      propertyAddress: "",
      askingPrice: "",
      motivation: "",
      leadSource: "Manual",
      status: "New Lead",
      notes: "",
      tags: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the details of the seller lead here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <LeadCoreFields
            sellerName={formData.sellerName}
            phone={formData.phone}
            propertyAddress={formData.propertyAddress}
            askingPrice={formData.askingPrice}
            tags={formData.tags}
            onSellerNameChange={(value) => setFormData((prev) => ({ ...prev, sellerName: value }))}
            onPhoneChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
            onPropertyAddressChange={(value) => setFormData((prev) => ({ ...prev, propertyAddress: value }))}
            onAskingPriceChange={(value) => setFormData((prev) => ({ ...prev, askingPrice: value }))}
            onTagToggle={handleTagToggle}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as LeadStatus })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                  <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                  <SelectItem value="Offer Made">Offer Made</SelectItem>
                  <SelectItem value="Under Contract">Under Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">Motivation</Label>
            <Input
              id="motivation"
              placeholder="Why are they selling?"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Initial Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
