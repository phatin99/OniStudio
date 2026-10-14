export type Locale = "vi" | "en";
export type Localized = { vi: string; en: string };
export type Category = string;
export type EquipmentStatus = "contact" | "available" | "maintenance" | "unavailable";
export type EquipmentUnitStatus = "available" | "rented" | "maintenance" | "unavailable";
export type EquipmentRentalSource = "internal" | "external";
export type BackdropKind = "effect" | "color";

export interface EquipmentCategory {
  id: string;
  slug: string;
  name: Localized;
  sort_order: number;
  is_visible?: boolean;
}

export interface EquipmentUnit {
  id: string;
  equipment_id: string;
  label: string;
  status: EquipmentUnitStatus;
  sort_order: number;
}

export interface EquipmentOption {
  id: string;
  name: string;
  name_en: string;
  category: Category;
  rental_source?: EquipmentRentalSource;
}

export interface IncludedEquipmentSummary {
  id: string;
  name: string;
  name_en: string;
}

export interface Equipment {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  category: Category;
  description: Localized;
  specifications: Localized;
  price: number | null;
  unit: Localized;
  included: boolean;
  status: EquipmentStatus;
  image_url: string | null;
  images?: string[];
  featured: boolean;
  published: boolean;
  sort_order: number;
  rental_source?: EquipmentRentalSource;
  included_equipment_ids?: string[];
  included_equipment_items?: IncludedEquipmentSummary[];
  inventory?: EquipmentUnit[];
}

export interface Backdrop {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  kind: BackdropKind;
  description: Localized;
  price: number | null;
  included: boolean;
  image_url: string | null;
  images?: string[];
  published: boolean;
  sort_order: number;
}

export interface PropItem {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  description: Localized;
  price: number | null;
  included: boolean;
  image_url: string | null;
  images?: string[];
  published: boolean;
  sort_order: number;
}

export interface StudioCardContent {
  type_label: Localized;
  kicker: Localized;
  availability_label: Localized;
  price_suffix: Localized;
  extra_fact: Localized;
  cta_label: Localized;
  show_type: boolean;
  show_kicker: boolean;
  show_availability: boolean;
  show_price: boolean;
  show_description: boolean;
  show_area: boolean;
  show_dimensions: boolean;
  show_extra_fact: boolean;
  show_cta: boolean;
}

export interface StudioDetailContent {
  card: StudioCardContent;
  minimum_booking: Localized;
  intro_title: Localized;
  intro_body: Localized;
  amenities: Localized;
  rules_title: Localized;
  rules: Localized;
  note: Localized;
  inquiry_title: Localized;
  inquiry_body: Localized;
}

export interface Studio {
  id: string;
  slug: string;
  name: string;
  description: Localized;
  area: number;
  price: number;
  led_count: number;
  images: string[];
  published: boolean;
  sort_order: number;
  width_m?: number | null;
  length_m?: number | null;
  height_m?: number | null;
  show_dimensions?: boolean;
  detail_content?: StudioDetailContent;
}

export interface GalleryCategory {
  id: string;
  slug: string;
  name: Localized;
  sort_order: number;
}

export interface GalleryItem {
  id: string;
  title: Localized;
  description?: Localized;
  category: string;
  image_url: string;
  images?: string[];
  facebook_url?: string | null;
  instagram_url?: string | null;
  photographer_name?: string | null;
  photographer_facebook_url?: string | null;
  photographer_instagram_url?: string | null;
  oni_production?: boolean;
  oni_lighting?: boolean;
  shot_at_oni?: boolean;
  published: boolean;
  sort_order: number;
}

export type ActionState = { error?: string; success?: string };
