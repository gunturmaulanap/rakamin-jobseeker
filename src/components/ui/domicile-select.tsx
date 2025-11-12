"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { IoIosArrowDown } from "react-icons/io";

// Data provinsi dan kota/kabupaten di Indonesia
const INDONESIAN_REGIONS = [
  // Sumatera
  {
    province: "Aceh",
    cities: [
      "Banda Aceh",
      "Sabang",
      "Langsa",
      "Lhokseumawe",
      "Meulaboh",
      "Tapaktuan",
      "Calang",
      "Sigli",
      "Jantho",
      "Kuta Cane",
    ],
  },
  {
    province: "Sumatera Utara",
    cities: [
      "Medan",
      "Binjai",
      "Tanjung Balai",
      "Pematangsiantar",
      "Sibolga",
      "Tebing Tinggi",
      "Padang Sidempuan",
      "Gunungsitoli",
      "Kabanjahe",
      "Kisaran",
    ],
  },
  {
    province: "Sumatera Barat",
    cities: [
      "Padang",
      "Bukittinggi",
      "Padangpanjang",
      "Pariaman",
      "Payakumbuh",
      "Solok",
      "Sawahlunto",
      "Bukit Tinggi",
      "Lubuk Basung",
      "Pariaman",
    ],
  },
  {
    province: "Riau",
    cities: [
      "Pekanbaru",
      "Dumai",
      "Bengkalis",
      "Rengat",
      "Tembilahan",
      "Siak Sri Indrapura",
      "Bagan Batu",
      "Batu Panjang",
      "Duri",
      "Perawang",
    ],
  },
  {
    province: "Kepulauan Riau",
    cities: [
      "Tanjung Pinang",
      "Batam",
      "Bintan",
      "Karimun",
      "Natuna",
      "Lingga",
      "Anambas",
      "Tarempa",
      "Tanjung Batu",
      "Kundur",
    ],
  },
  {
    province: "Jambi",
    cities: [
      "Jambi",
      "Sungai Penuh",
      "Muara Bulian",
      "Muara Bungo",
      "Sarolangun",
      "Bangko",
      "Muara Tebo",
      "Kuala Tungkal",
      "Maraok",
      "Sengeti",
    ],
  },
  {
    province: "Bengkulu",
    cities: [
      "Bengkulu",
      "Curup",
      "Manna",
      "Arga Makmur",
      "Muko-muko",
      "Kaur",
      "Kepahiang",
      "Lebong",
      "Rejang Lebong",
      "Seluma",
    ],
  },
  {
    province: "Sumatera Selatan",
    cities: [
      "Palembang",
      "Pagar Alam",
      "Lubuk Linggau",
      "Prabumulih",
      "Banyuasin",
      "Kayu Agung",
      "Ogan Ilir",
      "Ogan Komering",
      "Lahat",
      "Muara Enim",
    ],
  },
  {
    province: "Lampung",
    cities: [
      "Bandar Lampung",
      "Metro",
      "Kalianda",
      "Kotabumi",
      "Liwa",
      "Mesuji",
      "Pesawaran",
      "Pringsewu",
      "Tanggamus",
      "Tulang Bawang",
    ],
  },
  {
    province: "Bangka Belitung",
    cities: [
      "Pangkal Pinang",
      "Tanjung Pandan",
      "Manggar",
      "Sungai Liat",
      "Mentok",
      "Koba",
      "Belinyu",
      "Jebus",
      "Toboali",
      "Kelapa Kampit",
    ],
  },

  // Jawa
  {
    province: "DKI Jakarta",
    cities: [
      "Jakarta Pusat",
      "Jakarta Utara",
      "Jakarta Barat",
      "Jakarta Selatan",
      "Jakarta Timur",
      "Kepulauan Seribu",
    ],
  },
  {
    province: "Jawa Barat",
    cities: [
      "Bandung",
      "Bogor",
      "Depok",
      "Bekasi",
      "Cimahi",
      "Sukabumi",
      "Cirebon",
      "Tasikmalaya",
      "Banjar",
      "Cianjur",
      "Garut",
      "Indramayu",
      "Karawang",
      "Kuningan",
      "Majalengka",
      "Purwakarta",
      "Subang",
      "Sumedang",
      "Tasikmalaya",
    ],
  },
  {
    province: "Banten",
    cities: [
      "Serang",
      "Cilegon",
      "Tangerang",
      "Tangerang Selatan",
      "Lebak",
      "Pandeglang",
      "Cilegon",
      "Serang",
      "Tangerang",
    ],
  },
  {
    province: "Jawa Tengah",
    cities: [
      "Semarang",
      "Surakarta",
      "Pekalongan",
      "Tegal",
      "Salatiga",
      "Magelang",
      "Purwokerto",
      "Cilacap",
      "Kudus",
      "Jepara",
      "Demak",
      "Kendal",
      "Rembang",
      "Pati",
      "Blora",
      "Kebumen",
      "Purworejo",
      "Wonosobo",
      "Banjarnegara",
      "Batang",
    ],
  },
  {
    province: "DI Yogyakarta",
    cities: ["Yogyakarta", "Bantul", "Sleman", "Kulon Progo", "Gunung Kidul"],
  },
  {
    province: "Jawa Timur",
    cities: [
      "Surabaya",
      "Malang",
      "Kediri",
      "Blitar",
      "Madiun",
      "Probolinggo",
      "Pasuruan",
      "Mojokerto",
      "Sidoarjo",
      "Jombang",
      "Nganjuk",
      "Tuban",
      "Gresik",
      "Lamongan",
      "Bojonegoro",
      "Ngawi",
      "Magetan",
      "Ponorogo",
      "Pacitan",
      "Trenggalek",
      "Tulungagung",
      "Banyuwangi",
      "Jember",
      "Bondowoso",
      "Situbondo",
      "Lumajang",
      "Probolinggo",
    ],
  },

  // Bali & Nusa Tenggara
  {
    province: "Bali",
    cities: [
      "Denpasar",
      "Badung",
      "Gianyar",
      "Tabanan",
      "Klungkung",
      "Bangli",
      "Karangasem",
      "Buleleng",
      "Jembrana",
      "Ubud",
      "Kuta",
      "Seminyak",
      "Canggu",
    ],
  },
  {
    province: "Nusa Tenggara Barat",
    cities: [
      "Mataram",
      "Bima",
      "Lombok Barat",
      "Lombok Tengah",
      "Lombok Timur",
      "Sumbawa Barat",
      "Sumbawa",
      "Dompu",
      "Bima",
    ],
  },
  {
    province: "Nusa Tenggara Timur",
    cities: [
      "Kupang",
      "Flores Timur",
      "Kupang",
      "Sikka",
      "Ende",
      "Ngada",
      "Manggarai",
      "Manggarai Barat",
      "Manggarai Timur",
      "Sumba Barat",
      "Sumba Timur",
      "Sumba Tengah",
      "Sumba Barat Daya",
      "Alor",
      "Belu",
      "Timor Tengah Selatan",
      "Timor Tengah Utara",
      "Rote Ndao",
      "Sabu Raijua",
    ],
  },

  // Kalimantan
  {
    province: "Kalimantan Barat",
    cities: [
      "Pontianak",
      "Singkawang",
      "Sintang",
      "Bengkayang",
      "Kapuas Hulu",
      "Kayong Utara",
      "Ketapang",
      "Kubu Raya",
      "Landak",
      "Melawi",
      "Mempawah",
      "Sambas",
      "Sanggau",
      "Sekadau",
    ],
  },
  {
    province: "Kalimantan Tengah",
    cities: [
      "Palangkaraya",
      "Kotawaringin Barat",
      "Kotawaringin Timur",
      "Kapuas",
      "Barito Selatan",
      "Barito Timur",
      "Barito Utara",
      "Gunung Mas",
      "Katingan",
      "Lamandau",
      "Murung Raya",
      "Pulang Pisau",
      "Sukamara",
      "Seruyan",
    ],
  },
  {
    province: "Kalimantan Selatan",
    cities: [
      "Banjarmasin",
      "Banjarbaru",
      "Banjar",
      "Barito Kuala",
      "Hulu Sungai Selatan",
      "Hulu Sungai Tengah",
      "Hulu Sungai Utara",
      "Kotabaru",
      "Tabalong",
      "Tanah Bumbu",
      "Tanah Laut",
      "Tapin",
    ],
  },
  {
    province: "Kalimantan Timur",
    cities: [
      "Samarinda",
      "Balikpapan",
      "Bontang",
      "Kutai Kartanegara",
      "Kutai Timur",
      "Kutai Barat",
      "Paser",
      "Berau",
      "Penajam Paser Utara",
      "Mahakam Ulu",
    ],
  },
  {
    province: "Kalimantan Utara",
    cities: ["Tanjung Selor", "Bulungan", "Malinau", "Nunukan", "Tana Tidung"],
  },

  // Sulawesi
  {
    province: "Sulawesi Utara",
    cities: [
      "Manado",
      "Bitung",
      "Tomohon",
      "Kotamobagu",
      "Bolaang Mongondow",
      "Minahasa",
      "Kepulauan Sangihe",
      "Kepulauan Talaud",
      "Minahasa Selatan",
      "Minahasa Tenggara",
      "Minahasa Utara",
    ],
  },
  {
    province: "Sulawesi Tengah",
    cities: [
      "Palu",
      "Banggai",
      "Banggai Kepulauan",
      "Banggai Laut",
      "Buol",
      "Donggala",
      "Kota Morowali",
      "Morowali",
      "Parigi Moutong",
      "Poso",
      "Sigi",
      "Tojo Una-Una",
      "Tolitoli",
    ],
  },
  {
    province: "Sulawesi Selatan",
    cities: [
      "Makassar",
      "Parepare",
      "Palopo",
      "Bantaeng",
      "Barru",
      "Bone",
      "Bulukumba",
      "Enrekang",
      "Gowa",
      "Jeneponto",
      "Kepulauan Selayar",
      "Luwu",
      "Luwu Timur",
      "Luwu Utara",
      "Maros",
      "Pangkajene Kepulauan",
      "Pinrang",
      "Sidrap",
      "Sinjai",
      "Soppeng",
      "Takalar",
      "Tana Toraja",
      "Toraja Utara",
      "Wajo",
      "Pangkajene",
    ],
  },
  {
    province: "Sulawesi Tenggara",
    cities: [
      "Kendari",
      "Bau-Bau",
      "Kolaka",
      "Konawe",
      "Konawe Kepulauan",
      "Konawe Selatan",
      "Konawe Utara",
      "Muna",
      "Muna Barat",
      "Buton",
      "Buton Selatan",
      "Buton Tengah",
      "Buton Utara",
      "Wakatobi",
      "Bombana",
    ],
  },
  {
    province: "Sulawesi Barat",
    cities: [
      "Mamuju",
      "Majene",
      "Polewali Mandar",
      "Mamasa",
      "Mamuju Tengah",
      "Pasangkayu",
    ],
  },
  {
    province: "Gorontalo",
    cities: [
      "Gorontalo",
      "Boalemo",
      "Bone Bolango",
      "Gorontalo Utara",
      "Pohuwato",
    ],
  },

  // Maluku & Papua
  {
    province: "Maluku",
    cities: [
      "Ambon",
      "Tual",
      "Maluku Tengah",
      "Maluku Tenggara",
      "Maluku Tenggara Barat",
      "Buru",
      "Buru Selatan",
      "Seram Bagian Barat",
      "Seram Bagian Timur",
    ],
  },
  {
    province: "Maluku Utara",
    cities: [
      "Ternate",
      "Tidore Kepulauan",
      "Halmahera Barat",
      "Halmahera Tengah",
      "Halmahera Utara",
      "Halmahera Selatan",
      "Halmahera Timur",
      "Pulau Morotai",
      "Kepulauan Sula",
    ],
  },
  {
    province: "Papua Barat",
    cities: [
      "Manokwari",
      "Sorong",
      "Fakfak",
      "Kaimana",
      "Teluk Bintuni",
      "Teluk Wondama",
      "Pegunungan Arfak",
      "Maybrat",
      "Raja Ampat",
      "Sorong Selatan",
      "Tambrauw",
    ],
  },
  {
    province: "Papua",
    cities: [
      "Jayapura",
      "Merauke",
      "Timika",
      "Biak",
      "Nabire",
      "Yahukimo",
      "Keerom",
      "Puncak Jaya",
      "Paniai",
      "Mimika",
      "Sarmi",
      "Asmat",
      "Puncak",
      "Intan Jaya",
      "Deiyai",
      "Dogiyai",
      "Supiori",
      "Mamberamo Raya",
      "Mamberamo Tengah",
      "Yalimo",
      "Waropen",
      "Jayawijaya",
    ],
  },
];

interface DomicileInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function DomicileInput({
  value,
  onChange,
  placeholder = "Choose your domicile",
  className,
  error = false,
}: DomicileInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isItemSelected, setIsItemSelected] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync input value with prop value
  React.useEffect(() => {
    if (value !== inputValue && !isItemSelected) {
      setInputValue(value || "");
    }
  }, [value, inputValue, isItemSelected]);

  // Combine all regions into a flat list for search
  const allRegions = React.useMemo(() => {
    const regions: { value: string; label: string }[] = [];

    INDONESIAN_REGIONS.forEach(({ province, cities }) => {
      // Add province
      regions.push({
        value: province,
        label: province,
      });

      // Add cities with province context
      cities.forEach((city) => {
        regions.push({
          value: `${city}, ${province}`,
          label: `${city}, ${province}`,
        });
      });
    });

    return regions;
  }, []);

  // Filter regions based on search term
  const filteredRegions = React.useMemo(() => {
    if (!inputValue) return [];

    const lowerSearchTerm = inputValue.toLowerCase();
    return allRegions.filter((region) =>
      region.label.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allRegions, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsItemSelected(false);
    setShowDropdown(newValue.length > 0);
    onChange?.(newValue);
  };

  const handleSelect = (region: { value: string; label: string }) => {
    setInputValue(region.value);
    onChange?.(region.value);
    setShowDropdown(false);
    setIsItemSelected(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(inputValue.length > 0);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicking on options
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn(
            "w-full pr-10",
            "border",
            error
              ? "border-red-500 focus-visible:ring-red-100"
              : "border-gray-300",
            className
          )}
        />

        <IoIosArrowDown
          className={cn(
            "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none",
            error ? "text-red-500" : "text-gray-400"
          )}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && filteredRegions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50"
        >
          {filteredRegions.map((region, index) => (
            <button
              key={index}
              onClick={() => handleSelect(region)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors",
                "last:border-b-0"
              )}
            >
              <div className="font-medium text-gray-900">{region.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && inputValue && filteredRegions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-50"
        >
          <div className="text-center text-sm text-gray-500">
            No results found
          </div>
        </div>
      )}
    </div>
  );
}
