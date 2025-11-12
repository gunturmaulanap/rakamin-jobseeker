"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl } from "@/components/ui/form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control } from "react-hook-form";
import Image from "next/image";

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: "ID", name: "Indonesia", dialCode: "+62" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "TH", name: "Thailand", dialCode: "+66" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
  { code: "VN", name: "Vietnam", dialCode: "+84" },
  { code: "MM", name: "Myanmar", dialCode: "+95" },
  { code: "KH", name: "Cambodia", dialCode: "+855" },
  { code: "LA", name: "Laos", dialCode: "+856" },
  { code: "BN", name: "Brunei", dialCode: "+673" },
  { code: "TL", name: "Timor-Leste", dialCode: "+670" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

const PhoneInputComponent = ({
  value,
  onChange,
  onBlur,
  placeholder = "Phone number",
  disabled,
  error = false,
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(
    countries[0]
  ); // Default to Indonesia
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Use ref to track if change is from internal component to prevent infinite loop
  const isInternalChange = React.useRef(false);

  // Extract country code and phone number from initial value
  React.useEffect(() => {
    if (value && value.trim()) {
      // Find matching country by dial code
      const matchingCountry = countries.find((country) =>
        value.startsWith(country.dialCode)
      );

      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneNumber(value.replace(matchingCountry.dialCode, "").trim());
      } else {
        // If no matching country found, just use the value as phone number
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber("");
    }
  }, [value]);

  // Update form value when country or phone number changes, but not on initial load
  React.useEffect(() => {
    // Only update if this is an internal change (not from external value prop)
    if (isInternalChange.current) {
      isInternalChange.current = false;

      if (phoneNumber !== "") {
        const fullValue = `${selectedCountry.dialCode} ${phoneNumber}`;
        onChange(fullValue);
      } else {
        onChange("");
      }
    }
  }, [selectedCountry, phoneNumber, onChange]);

  const handleCountrySelect = (country: Country) => {
    isInternalChange.current = true;
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, ""); // Remove spaces
    isInternalChange.current = true;
    setPhoneNumber(value);
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onBlur={onBlur}
        className={`pl-28 pr-4 focus-visible:ring-2 border ${
          error
            ? "border-red-500 focus-visible:ring-red-100"
            : "border-gray-300 focus-visible:ring-[#01959F] focus-visible:border-[#01959F]"
        }`}
        disabled={disabled}
      />

      {/* Country Selector Inside Input */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute left-0 top-0 h-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-none border-r"
            disabled={disabled}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden">
              <Image
                src={`/flags/1x1/${selectedCountry.code.toLowerCase()}.svg`}
                alt={selectedCountry.name}
                className="w-full h-full object-cover"
                width={32}
                height={32}
              />
            </div>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="bg-white rounded-lg shadow-lg border">
            {/* Search Input */}
            <div className="p-3 border-b">
              <Input
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-200"
              />
            </div>

            {/* Country List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                  onClick={() => handleCountrySelect(country)}
                >
                  <div className="w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
                    <Image
                      src={`/flags/1x1/${country.code.toLowerCase()}.svg`}
                      alt={country.name}
                      className="w-full h-full object-cover"
                      width={32}
                      height={32}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-900">
                      {country.name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {country.dialCode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dial Code Display */}
      <div className="absolute left-[72px] top-1/2 transform -translate-y-1/2 text-sm font-medium pointer-events-none text-gray-600">
        {selectedCountry.dialCode}
      </div>
    </div>
  );
};

interface PhoneInputFieldProps {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const PhoneInputField = ({
  control,
  name,
  label,
  placeholder = "81XXXXXXXXX",
  required = false,
  disabled = false,
}: PhoneInputFieldProps) => {
  const [touched, setTouched] = React.useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // Show error if there's an error and field has been touched or submitted
        const showError = !!fieldState.error;

        return (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <PhoneInputComponent
                value={field.value || ""}
                onChange={(value) => {
                  field.onChange(value);
                }}
                onBlur={() => {
                  field.onBlur();
                }}
                placeholder={placeholder}
                disabled={disabled}
                error={showError}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default PhoneInputComponent;
