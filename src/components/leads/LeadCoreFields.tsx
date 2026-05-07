import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const LEAD_DISTRESS_TAGS = [
  "Pre-Foreclosure",
  "Tax Delinquent",
  "Vacant",
  "Tired Landlord",
  "Probate",
  "Absentee Owner",
  "Code Violation",
  "High Equity",
  "Needs Follow-Up",
  "Needs Skiptrace",
] as const;

type LeadCoreFieldsProps = {
  sellerName: string;
  phone: string;
  propertyAddress: string;
  askingPrice: string;
  tags: string[];
  onSellerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPropertyAddressChange: (value: string) => void;
  onAskingPriceChange: (value: string) => void;
  onTagToggle: (tag: string) => void;
  sellerNameRequired?: boolean;
};

export function LeadCoreFields({
  sellerName,
  phone,
  propertyAddress,
  askingPrice,
  tags,
  onSellerNameChange,
  onPhoneChange,
  onPropertyAddressChange,
  onAskingPriceChange,
  onTagToggle,
  sellerNameRequired = true,
}: LeadCoreFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sellerName">Seller Name {sellerNameRequired ? "*" : ""}</Label>
          <Input
            id="sellerName"
            required={sellerNameRequired}
            value={sellerName}
            onChange={(e) => onSellerNameChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyAddress">Property Address</Label>
        <Input
          id="propertyAddress"
          value={propertyAddress}
          onChange={(e) => onPropertyAddressChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="askingPrice">Asking Price ($)</Label>
        <Input
          id="askingPrice"
          type="number"
          value={askingPrice}
          onChange={(e) => onAskingPriceChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Distress Tags</Label>
        <div className="flex flex-wrap gap-2">
          {LEAD_DISTRESS_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                tags.includes(tag)
                  ? "bg-blue-100 border-blue-200 text-blue-700 font-medium"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
