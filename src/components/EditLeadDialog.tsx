import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { useAppStore } from "../store/useAppStore";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Lead } from "../types";
import { LeadCoreFields } from "./leads/LeadCoreFields";

export function EditLeadDialog({ lead }: { lead: Lead }) {
  const { updateLead } = useAppStore();
  const [open, setOpen] = useState(false);

  const [sellerName, setSellerName] = useState(lead.sellerName);
  const [phone, setPhone] = useState(lead.phone);
  const [propertyAddress, setPropertyAddress] = useState(lead.propertyAddress);
  const [askingPrice, setAskingPrice] = useState<string>(lead.askingPrice?.toString() || "");
  const [tags, setTags] = useState<string[]>(lead.tags || []);

  const handleTagToggle = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  useEffect(() => {
    setSellerName(lead.sellerName);
    setPhone(lead.phone);
    setPropertyAddress(lead.propertyAddress);
    setAskingPrice(lead.askingPrice?.toString() || "");
    setTags(lead.tags || []);
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerName || !phone || !propertyAddress) {
      toast.error("Please fill in all required fields.");
      return;
    }

    updateLead(lead.id, {
      sellerName,
      phone,
      propertyAddress,
      askingPrice: askingPrice ? Number(askingPrice) : null,
      tags,
    });

    setOpen(false);
    toast.success("Lead updated successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-slate-100 hover:text-accent-foreground h-9 w-9">
          <Pencil className="h-4 w-4" />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the contact details for this lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <LeadCoreFields
            sellerName={sellerName}
            phone={phone}
            propertyAddress={propertyAddress}
            askingPrice={askingPrice}
            tags={tags}
            onSellerNameChange={setSellerName}
            onPhoneChange={setPhone}
            onPropertyAddressChange={setPropertyAddress}
            onAskingPriceChange={setAskingPrice}
            onTagToggle={handleTagToggle}
          />
          <DialogFooter className="pt-2">
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
