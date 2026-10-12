"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_CACHE_TAG } from "@/lib/cache-tags";
import {
  DEFAULT_STUDIO_DETAIL_CONTENT,
  normalizeStudioDetailContent,
} from "@/data/studio-detail";
import {
  equipmentPayload,
  imageList,
  integer,
  inventoryStatus,
  slug,
  text,
  uuid,
} from "@/lib/validation";
import { studioSlugFromName } from "@/lib/studio-slug";
import type { ActionState } from "@/types/catalog";

export async function login(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isConfigured()) {
    return {
      error:
        "Chưa cấu hình Supabase. Xem README để kết nối database và tạo tài khoản admin.",
    };
  }
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || email.length > 254 || password.length > 256 || !password) {
    return { error: "Kiểm tra email và mật khẩu." };
  }
  const db = await createAuthClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: "Đăng nhập không thành công. Kiểm tra thông tin hoặc thử lại sau.",
    };
  }
  const { data: allowed } = await db.rpc("is_admin");
  if (allowed !== true) {
    await db.auth.signOut();
    return { error: "Tài khoản chưa được cấp quyền quản trị." };
  }
  redirect("/admin");
}

export async function logout() {
  const db = await createAuthClient();
  await db.auth.signOut();
  redirect("/admin/login");
}

function dbMessage(code?: string) {
  if (["PGRST204", "42703", "42P01"].includes(code || "")) {
    return "Database chưa có cấu trúc danh mục/tồn kho mới. Hãy chạy migration 003_admin_categories_inventory.sql trong Supabase.";
  }
  if (code === "23505") {
    return "Dữ liệu bị trùng. Kiểm tra slug hoặc mã thiết bị.";
  }
  if (code === "23503") {
    return "Dữ liệu đang được sử dụng hoặc tham chiếu không hợp lệ.";
  }
  return "Không thể lưu dữ liệu. Kiểm tra kết nối và quyền Supabase.";
}

function refreshPublicCatalog() {
  updateTag(CATALOG_CACHE_TAG);
}

function revalidateEquipment(equipmentId?: string) {
  void equipmentId;
  refreshPublicCatalog();
}

function revalidateEquipmentCategories() {
  refreshPublicCatalog();
  revalidatePath("/admin/equipment");
  revalidatePath("/admin/categories");
}

function revalidateStudios(studioId?: string) {
  void studioId;
  refreshPublicCatalog();
}

function revalidateGallery(galleryId?: string) {
  void galleryId;
  refreshPublicCatalog();
}

function revalidateGalleryCategories() {
  refreshPublicCatalog();
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/gallery/categories");
}

export async function saveEquipment(
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let payload;
  try {
    payload = equipmentPayload(form);
    if (id) uuid(id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) {
    return { error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const query = id
    ? session.db.from("equipment").update(payload).eq("id", id)
    : session.db.from("equipment").insert(payload);
  const { data, error } = await query.select("id").single();

  if (error?.code === "23503") {
    return { error: "Danh mục đã bị xóa hoặc không tồn tại." };
  }
  if (error || !data) return { error: dbMessage(error?.code) };

  revalidateEquipment(data.id);
  redirect("/admin/equipment?saved=1");
}

export async function deleteEquipment(
  id: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  try {
    uuid(id);
  } catch {
    return { error: "ID không hợp lệ." };
  }
  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data, error } = await session.db
    .from("equipment")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) return { error: "Không thể xóa thiết bị." };

  revalidateEquipment(id);
  redirect("/admin/equipment?deleted=1");
}

export async function saveEquipmentCategory(
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let payload;
  try {
    if (id) uuid(id);
    payload = {
      slug: slug(form),
      name: {
        vi: text(form, "name_vi", 120),
        en: text(form, "name_en", 120),
      },
      sort_order: integer(form, "sort_order", 100000),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Danh mục không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const query = id
    ? session.db.from("equipment_categories").update(payload).eq("id", id)
    : session.db.from("equipment_categories").insert(payload);
  const { data, error } = await query.select("id").single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "Slug danh mục đã tồn tại." };
    }
    return { error: dbMessage(error?.code) };
  }

  revalidateEquipmentCategories();

  if (id) {
    return { success: "Đã cập nhật danh mục." };
  }

  redirect("/admin/categories?saved=1");
}

export async function deleteEquipmentCategory(
  id: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  try {
    uuid(id);
  } catch {
    return { error: "ID danh mục không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data, error } = await session.db
    .from("equipment_categories")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error?.code === "23503") {
    return {
      error:
        "Không thể xóa danh mục đang có thiết bị. Hãy chuyển thiết bị sang danh mục khác trước.",
    };
  }
  if (error || !data) return { error: dbMessage(error?.code) };

  revalidateEquipmentCategories();
  return { success: "Đã xóa danh mục." };
}

export async function addEquipmentUnits(
  equipmentId: string,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let count: number;
  let status;
  try {
    uuid(equipmentId);
    count = integer(form, "count", 50) ?? 0;
    if (count < 1) throw new Error("Số lượng thêm phải từ 1 đến 50.");
    status = inventoryStatus(form);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Số lượng không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data: existing, error: listError } = await session.db
    .from("equipment_units")
    .select("label,sort_order")
    .eq("equipment_id", equipmentId)
    .order("sort_order");

  if (listError) return { error: dbMessage(listError.code) };

  const used = new Set((existing || []).map((row) => String(row.label)));
  const maxOrder = Math.max(
    -1,
    ...(existing || []).map((row) => Number(row.sort_order) || 0),
  );
  const rows = [];
  let sequence = 1;

  while (rows.length < count) {
    const label = `#${String(sequence).padStart(2, "0")}`;
    sequence += 1;
    if (used.has(label)) continue;
    used.add(label);
    rows.push({
      equipment_id: equipmentId,
      label,
      status,
      sort_order: maxOrder + rows.length + 1,
    });
  }

  const { error } = await session.db.from("equipment_units").insert(rows);
  if (error) return { error: dbMessage(error.code) };

  revalidateEquipment(equipmentId);
  return { success: `Đã thêm ${count} thiết bị vào tồn kho.` };
}

export async function saveEquipmentUnit(
  equipmentId: string,
  unitId: string,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let payload;
  try {
    uuid(equipmentId);
    uuid(unitId);
    payload = {
      label: text(form, "label", 80),
      status: inventoryStatus(form),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Tồn kho không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data, error } = await session.db
    .from("equipment_units")
    .update(payload)
    .eq("id", unitId)
    .eq("equipment_id", equipmentId)
    .select("id")
    .single();

  if (error || !data) return { error: dbMessage(error?.code) };

  revalidateEquipment(equipmentId);
  return { success: "Đã cập nhật tình trạng." };
}

export async function deleteEquipmentUnit(
  equipmentId: string,
  unitId: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  try {
    uuid(equipmentId);
    uuid(unitId);
  } catch {
    return { error: "ID tồn kho không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data, error } = await session.db
    .from("equipment_units")
    .delete()
    .eq("id", unitId)
    .eq("equipment_id", equipmentId)
    .select("id")
    .single();

  if (error || !data) return { error: dbMessage(error?.code) };

  revalidateEquipment(equipmentId);
  return { success: "Đã xóa một thiết bị khỏi tồn kho." };
}

/* oni-rental-catalog-actions-v1:start */
function revalidateBackdrops(id?: string) {
  void id;
  refreshPublicCatalog();
}
function revalidateProps(id?: string) {
  void id;
  refreshPublicCatalog();
}
function rentalAssetPayload(form: FormData) {
 const images=imageList(form); const included=form.get("included")==="on"; const price=included?null:integer(form,"price",1000000000,true);
 if (!included && price===null) throw new Error("Hãy nhập giá thuê hoặc chọn Miễn phí.");
 return { name:text(form,"name",160), name_en:text(form,"name_en",160), slug:slug(form), description:{vi:text(form,"description_vi",3000,false),en:text(form,"description_en",3000,false)}, price:included?null:price, included, image_url:images[0]||null, images, published:form.get("published")==="on", sort_order:integer(form,"sort_order",100000)??0 };
}
export async function saveBackdrop(id:string|null,_previous:ActionState,form:FormData):Promise<ActionState>{ let payload; try { if(id)uuid(id); const kind=text(form,"kind",20); if(!["color","effect"].includes(kind)) throw new Error("Loại phông không hợp lệ."); payload={...rentalAssetPayload(form),kind}; } catch(error){ return {error:error instanceof Error?error.message:"Dữ liệu phông không hợp lệ."}; } const session=await requireAdmin().catch(()=>null); if(!session)return{error:"Vui lòng đăng nhập lại."}; const query=id?session.db.from("backdrops").update(payload).eq("id",id):session.db.from("backdrops").insert(payload); const {data,error}=await query.select("id").single(); if(error?.code==="23505")return{error:"Slug phông đã tồn tại."}; if(error||!data)return{error:"Không thể lưu phông. Kiểm tra migration 100_rental_catalog_split.sql và quyền Supabase."}; revalidateBackdrops(data.id); redirect("/admin/backdrops?saved=1"); }
export async function deleteBackdrop(id:string,_previous:ActionState):Promise<ActionState>{ void _previous; try{uuid(id)}catch{return{error:"ID phông không hợp lệ."}} const session=await requireAdmin().catch(()=>null); if(!session)return{error:"Vui lòng đăng nhập lại."}; const {data,error}=await session.db.from("backdrops").delete().eq("id",id).select("id").single(); if(error||!data)return{error:"Không thể xóa phông."}; revalidateBackdrops(id); redirect("/admin/backdrops?deleted=1"); }
export async function saveProp(id:string|null,_previous:ActionState,form:FormData):Promise<ActionState>{ let payload; try{if(id)uuid(id);payload=rentalAssetPayload(form)}catch(error){return{error:error instanceof Error?error.message:"Dữ liệu đạo cụ không hợp lệ."}} const session=await requireAdmin().catch(()=>null); if(!session)return{error:"Vui lòng đăng nhập lại."}; const query=id?session.db.from("props").update(payload).eq("id",id):session.db.from("props").insert(payload); const {data,error}=await query.select("id").single(); if(error?.code==="23505")return{error:"Slug đạo cụ đã tồn tại."}; if(error||!data)return{error:"Không thể lưu đạo cụ. Kiểm tra migration 100_rental_catalog_split.sql và quyền Supabase."}; revalidateProps(data.id); redirect("/admin/props?saved=1"); }
export async function deleteProp(id:string,_previous:ActionState):Promise<ActionState>{ void _previous; try{uuid(id)}catch{return{error:"ID đạo cụ không hợp lệ."}} const session=await requireAdmin().catch(()=>null); if(!session)return{error:"Vui lòng đăng nhập lại."}; const {data,error}=await session.db.from("props").delete().eq("id",id).select("id").single(); if(error||!data)return{error:"Không thể xóa đạo cụ."}; revalidateProps(id); redirect("/admin/props?deleted=1"); }
/* oni-rental-catalog-actions-v1:end */

function studioSaveError(error: {
  code?: string;
  message?: string;
} | null): string {
  if (!error) return "Không thể lưu phòng. Vui lòng thử lại.";
  const code = error.code || "UNKNOWN";
  const message = error.message || "";

  if (code === "23505") {
    return "Slug phòng đã tồn tại. Vui lòng chọn slug khác.";
  }
  if (code === "23502" && /capacity/i.test(message)) {
    return "Supabase thiếu giá trị mặc định capacity của phòng. " +
      "Cần áp dụng migration 140_studio_content_dimensions.sql.";
  }
  if (code === "PGRST204" || code === "42703" || code === "42P01") {
    return "Cấu trúc bảng studios trong Supabase chưa đồng bộ. " +
      "Kiểm tra migration 140_studio_content_dimensions.sql " +
      `(mã lỗi: ${code}).`;
  }
  if (code === "42501" || code === "PGRST301") {
    return "Không có quyền lưu phòng. Đăng nhập lại và kiểm tra " +
      "public.admin_users, public.is_admin() va RLS.";
  }
  if (code === "23514") {
    return "Dữ liệu phòng không đáp ứng ràng buộc database. " +
      "Kiểm tra diện tích, giá và thông số phòng.";
  }
  return `Không thể lưu phòng (Supabase: ${code}). ` +
    "Kiểm tra Terminal/SQL Editor để biết chi tiết.";
}

export async function saveStudio(
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  void _previous;

  function optionalDimension(key: string) {
    const raw = String(form.get(key) || "")
      .trim()
      .replace(",", ".");

    if (!raw) return null;

    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new Error("Kích thước phòng phải lớn hơn 0 và không vượt quá 1000m.");
    }

    return Math.round(value * 100) / 100;
  }

  function detailText(
    key: string,
    fallback: string,
    maxLength: number,
  ) {
    const value = text(form, key, maxLength, false);
    return value || fallback;
  }

  let payload;

  try {
    if (id) uuid(id);
    if (form.get("card_preview_confirmed") !== "1") {
      throw new Error(
        "Hãy xem trước Card và bấm Xác nhận & cập nhật Client trước khi lưu.",
      );
    }

    const area = integer(form, "area", 100000);
    if (!area) {
      throw new Error("Diện tích phải lớn hơn 0.");
    }

    const width = optionalDimension("width_m");
    const length = optionalDimension("length_m");
    const height = optionalDimension("height_m");
    const showDimensions = form.get("show_dimensions") === "on";

    if (showDimensions && !width && !length && !height) {
      throw new Error(
        "Hãy nhập ít nhất một kích thước trước khi bật hiển thị thông số nâng cao.",
      );
    }

    const defaults = DEFAULT_STUDIO_DETAIL_CONTENT;

    payload = {
      name: text(form, "name", 160),
      slug: id ? slug(form) : studioSlugFromName(text(form, "name", 160)),
      description: {
        vi: text(form, "description_vi"),
        en: text(form, "description_en"),
      },
      area,
      width_m: width,
      length_m: length,
      height_m: height,
      show_dimensions: showDimensions,
      price: integer(form, "price"),
      images: imageList(form),
      published: form.get("published") === "on",
      detail_content: {
        card: {
          type_label: {
            vi: detailText(
              "card_type_vi",
              defaults.card.type_label.vi,
              80,
            ),
            en: detailText(
              "card_type_en",
              defaults.card.type_label.en,
              80,
            ),
          },
          kicker: {
            vi: detailText(
              "card_kicker_vi",
              defaults.card.kicker.vi,
              80,
            ),
            en: detailText(
              "card_kicker_en",
              defaults.card.kicker.en,
              80,
            ),
          },
          availability_label: {
            vi: detailText(
              "card_availability_vi",
              defaults.card.availability_label.vi,
              80,
            ),
            en: detailText(
              "card_availability_en",
              defaults.card.availability_label.en,
              80,
            ),
          },
          price_suffix: {
            vi: detailText(
              "card_price_suffix_vi",
              defaults.card.price_suffix.vi,
              40,
            ),
            en: detailText(
              "card_price_suffix_en",
              defaults.card.price_suffix.en,
              40,
            ),
          },
          extra_fact: {
            vi: detailText(
              "card_extra_fact_vi",
              defaults.card.extra_fact.vi,
              120,
            ),
            en: detailText(
              "card_extra_fact_en",
              defaults.card.extra_fact.en,
              120,
            ),
          },
          cta_label: {
            vi: detailText(
              "card_cta_vi",
              defaults.card.cta_label.vi,
              80,
            ),
            en: detailText(
              "card_cta_en",
              defaults.card.cta_label.en,
              80,
            ),
          },
          show_type: form.get("card_show_type") === "on",
          show_kicker: form.get("card_show_kicker") === "on",
          show_availability:
            form.get("card_show_availability") === "on",
          show_price: form.get("card_show_price") === "on",
          show_description:
            form.get("card_show_description") === "on",
          show_area: form.get("card_show_area") === "on",
          show_dimensions:
            form.get("card_show_dimensions") === "on",
          show_extra_fact:
            form.get("card_show_extra_fact") === "on",
          show_cta: form.get("card_show_cta") === "on",
        },
        minimum_booking: {
          vi: detailText(
            "detail_minimum_booking_vi",
            defaults.minimum_booking.vi,
            120,
          ),
          en: detailText(
            "detail_minimum_booking_en",
            defaults.minimum_booking.en,
            120,
          ),
        },
        intro_title: {
          vi: detailText(
            "detail_intro_title_vi",
            defaults.intro_title.vi,
            180,
          ),
          en: detailText(
            "detail_intro_title_en",
            defaults.intro_title.en,
            180,
          ),
        },
        intro_body: {
          vi: detailText(
            "detail_intro_body_vi",
            defaults.intro_body.vi,
            5000,
          ),
          en: detailText(
            "detail_intro_body_en",
            defaults.intro_body.en,
            5000,
          ),
        },
        amenities: {
          vi: detailText(
            "detail_amenities_vi",
            defaults.amenities.vi,
            12000,
          ),
          en: detailText(
            "detail_amenities_en",
            defaults.amenities.en,
            12000,
          ),
        },
        rules_title: {
          vi: detailText(
            "detail_rules_title_vi",
            defaults.rules_title.vi,
            180,
          ),
          en: detailText(
            "detail_rules_title_en",
            defaults.rules_title.en,
            180,
          ),
        },
        rules: {
          vi: detailText(
            "detail_rules_vi",
            defaults.rules.vi,
            10000,
          ),
          en: detailText(
            "detail_rules_en",
            defaults.rules.en,
            10000,
          ),
        },
        note: {
          vi: detailText(
            "detail_note_vi",
            defaults.note.vi,
            3000,
          ),
          en: detailText(
            "detail_note_en",
            defaults.note.en,
            3000,
          ),
        },
        inquiry_title: {
          vi: detailText(
            "detail_inquiry_title_vi",
            defaults.inquiry_title.vi,
            180,
          ),
          en: detailText(
            "detail_inquiry_title_en",
            defaults.inquiry_title.en,
            180,
          ),
        },
        inquiry_body: {
          vi: detailText(
            "detail_inquiry_body_vi",
            defaults.inquiry_body.vi,
            3000,
          ),
          en: detailText(
            "detail_inquiry_body_en",
            defaults.inquiry_body.en,
            3000,
          ),
        },
      },
    };

    if (payload.images.length > 12) {
      throw new Error("Tối đa 12 ảnh cho một phòng.");
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  if (id) {
    const { data, error } = await session.db
      .from("studios")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();

    if (error || !data) return { error: studioSaveError(error) };

    revalidateStudios(data.id);
    redirect("/admin/studios?saved=1");
  }

  const { data: lastRoom, error: orderError } = await session.db
    .from("studios")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    return { error: studioSaveError(orderError) };
  }

  const nextOrder = Math.min(
    Math.max(Number(lastRoom?.sort_order ?? -1) + 1, 0),
    100000,
  );

  // oni-studio-slug-autogen-v1:start
  // A unique DB constraint makes this safe even when two admins create the same name.
  const baseSlug = payload.slug;
  for (let number = 1; number <= 100; number += 1) {
    const suffix = number === 1 ? "" : `-${number}`;
    const candidate = `${baseSlug.slice(0, 120 - suffix.length)}${suffix}`;
    const { data, error } = await session.db
      .from("studios")
      .insert({ ...payload, slug: candidate, sort_order: nextOrder })
      .select("id")
      .single();

    if (!error && data) {
      revalidateStudios(data.id);
      redirect("/admin/studios?saved=1");
    }

    // Retry only collisions of the slug; other DB errors must stay visible.
    if (error?.code !== "23505" || !/slug/i.test(`${error.message ?? ""} ${error.details ?? ""}`)) {
      return { error: studioSaveError(error) };
    }
  }
  return { error: "Không tìm được đường dẫn phòng còn trống. Hãy đặt tên khác." };
  // oni-studio-slug-autogen-v1:end
}


export async function saveStudioDetailContent(
  id: string,
  form: FormData,
): Promise<ActionState> {
  try {
    uuid(id);
  } catch {
    return { error: "ID phòng không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) {
    return { error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const { data: currentRow, error: currentError } = await session.db
    .from("studios")
    .select("detail_content,led_count")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !currentRow) {
    return { error: "Không tìm thấy phòng cần cập nhật." };
  }

  const current = normalizeStudioDetailContent(
    currentRow.detail_content,
    Number(currentRow.led_count || 0),
  );

  function detailText(
    key: string,
    fallback: string,
    maxLength: number,
  ) {
    const value = text(form, key, maxLength, false);
    return value || fallback;
  }

  const detailContent = {
    ...current,
    minimum_booking: {
      vi: detailText(
        "detail_minimum_booking_vi",
        current.minimum_booking.vi,
        120,
      ),
      en: detailText(
        "detail_minimum_booking_en",
        current.minimum_booking.en,
        120,
      ),
    },
    intro_title: {
      vi: detailText(
        "detail_intro_title_vi",
        current.intro_title.vi,
        180,
      ),
      en: detailText(
        "detail_intro_title_en",
        current.intro_title.en,
        180,
      ),
    },
    intro_body: {
      vi: detailText(
        "detail_intro_body_vi",
        current.intro_body.vi,
        5000,
      ),
      en: detailText(
        "detail_intro_body_en",
        current.intro_body.en,
        5000,
      ),
    },
    amenities: {
      vi: detailText(
        "detail_amenities_vi",
        current.amenities.vi,
        12000,
      ),
      en: detailText(
        "detail_amenities_en",
        current.amenities.en,
        12000,
      ),
    },
    rules_title: {
      vi: detailText(
        "detail_rules_title_vi",
        current.rules_title.vi,
        180,
      ),
      en: detailText(
        "detail_rules_title_en",
        current.rules_title.en,
        180,
      ),
    },
    rules: {
      vi: detailText(
        "detail_rules_vi",
        current.rules.vi,
        10000,
      ),
      en: detailText(
        "detail_rules_en",
        current.rules.en,
        10000,
      ),
    },
    note: {
      vi: detailText(
        "detail_note_vi",
        current.note.vi,
        3000,
      ),
      en: detailText(
        "detail_note_en",
        current.note.en,
        3000,
      ),
    },
    inquiry_title: {
      vi: detailText(
        "detail_inquiry_title_vi",
        current.inquiry_title.vi,
        180,
      ),
      en: detailText(
        "detail_inquiry_title_en",
        current.inquiry_title.en,
        180,
      ),
    },
    inquiry_body: {
      vi: detailText(
        "detail_inquiry_body_vi",
        current.inquiry_body.vi,
        3000,
      ),
      en: detailText(
        "detail_inquiry_body_en",
        current.inquiry_body.en,
        3000,
      ),
    },
  };

  const { data, error } = await session.db
    .from("studios")
    .update({ detail_content: detailContent })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: dbMessage(error?.code) };
  }

  revalidateStudios(data.id);

  return {
    success: "Đã cập nhật nội dung trang chi tiết phòng.",
  };
}

export async function deleteStudio(
  id: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  try {
    uuid(id);
  } catch {
    return { error: "ID phòng không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { count, error: countError } = await session.db
    .from("studios")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return { error: "Không thể kiểm tra số lượng phòng hiện tại." };
  }
  if ((count ?? 0) <= 1) {
    return { error: "Oni Studio phải có tối thiểu 1 phòng. Không thể xóa phòng cuối cùng." };
  }

  const { error } = await session.db.from("studios").delete().eq("id", id);
  if (error) {
    if (error.message?.includes("at_least_one_studio_required")) {
      return { error: "Oni Studio phải có tối thiểu 1 phòng. Không thể xóa phòng cuối cùng." };
    }
    return { error: "Không thể xóa phòng. Kiểm tra kết nối và quyền Supabase." };
  }

  revalidateStudios(id);
  redirect("/admin/studios?deleted=1");
}

export async function saveGallery(
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let payload;
  let selectedCategory = "";

  try {
    if (id) uuid(id);

    selectedCategory = text(form, "category", 120);

    const images = imageList(form);
    if (!images.length) {
      throw new Error("Cần chọn ít nhất một ảnh cho bộ ảnh.");
    }
    if (images.length > 24) {
      throw new Error("Một bộ ảnh tối đa 24 hình.");
    }

    function optionalUrl(key: string) {
      const value = text(form, key, 1200, false);
      if (!value) return null;

      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        throw new Error(`Link ${key} không hợp lệ.`);
      }

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(`Link ${key} phải bắt đầu bằng http hoặc https.`);
      }

      return parsed.toString();
    }

    payload = {
      title: {
        vi: text(form, "title_vi", 200),
        en: text(form, "title_en", 200, false) || text(form, "title_vi", 200),
      },
      description: {
        vi: text(form, "description_vi", 3000, false),
        en: text(form, "description_en", 3000, false),
      },
      category: selectedCategory,
      image_url: images[0],
      images,
      facebook_url: optionalUrl("facebook_url"),
      instagram_url: optionalUrl("instagram_url"),
      photographer_name: text(form, "photographer_name", 160, false) || null,
      photographer_facebook_url: optionalUrl("photographer_facebook_url"),
      photographer_instagram_url: optionalUrl("photographer_instagram_url"),
      oni_production: form.get("oni_production") === "on",
      oni_lighting: form.get("oni_lighting") === "on",
      shot_at_oni: form.get("shot_at_oni") === "on",
      published: form.get("published") === "on",
      sort_order: integer(form, "sort_order", 99988) ?? 0,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const query = id
    ? session.db.from("gallery").update(payload).eq("id", id)
    : session.db.from("gallery").insert(payload);
  const { data, error } = await query.select("id").single();

  if (error?.code === "23503") {
    return { error: "Danh mục thư viện không tồn tại hoặc đã bị xóa." };
  }
  if (error || !data) return { error: dbMessage(error?.code) };

  revalidateGallery(data.id);
  redirect("/admin/gallery?saved=1");
}

export async function saveGalleryCategory(
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let payload;

  try {
    if (id) uuid(id);

    const rawSlug = text(form, "slug", 120).toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug)) {
      throw new Error("Slug chỉ gồm chữ thường, số và dấu gạch nối.");
    }

    payload = {
      slug: rawSlug,
      name: {
        vi: text(form, "name_vi", 120),
        en: text(form, "name_en", 120),
      },
      sort_order: integer(form, "sort_order", 100000) ?? 0,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
    };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const query = id
    ? session.db
        .from("gallery_categories")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : session.db
        .from("gallery_categories")
        .insert(payload)
        .select("id")
        .single();

  const { data, error } = await query;

  if (error?.code === "23505") {
    return { error: "Slug danh mục đã tồn tại." };
  }

  if (error || !data) {
    return {
      error:
        "Không thể lưu danh mục. Kiểm tra migration 006 và quyền Supabase.",
    };
  }

  revalidateGalleryCategories();
  return { success: id ? "Đã cập nhật danh mục." : "Đã thêm danh mục." };
}

export async function deleteGalleryCategory(
  id: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;

  try {
    uuid(id);
  } catch {
    return { error: "ID danh mục không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { data: category, error: categoryError } = await session.db
    .from("gallery_categories")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (categoryError) {
    return {
      error:
        "Không thể đọc danh mục. Kiểm tra migration 006 và quyền Supabase.",
    };
  }

  if (!category) return { error: "Danh mục không tồn tại." };

  const { count, error: usageError } = await session.db
    .from("gallery")
    .select("id", { count: "exact", head: true })
    .eq("category", category.slug);

  if (usageError) {
    return { error: "Không thể kiểm tra album đang sử dụng danh mục." };
  }

  if ((count || 0) > 0) {
    return {
      error: `Danh mục đang được ${count} bộ ảnh sử dụng. Hãy đổi danh mục cho các album trước khi xóa.`,
    };
  }

  const { data, error } = await session.db
    .from("gallery_categories")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Không thể xóa danh mục." };
  }

  revalidateGalleryCategories();
  return { success: "Đã xóa danh mục." };
}

export async function deleteGallery(
  id: string,
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  try {
    uuid(id);
  } catch {
    return { error: "ID không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);
  if (!session) return { error: "Vui lòng đăng nhập lại." };

  const { error } = await session.db.from("gallery").delete().eq("id", id);
  if (error) return { error: "Không thể xóa ảnh." };

  revalidateGallery();
  return { success: "Đã xóa ảnh khỏi thư viện website." };
}


export async function reorderBackdrops(
  _previous: { error?: string; success?: string },
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  return reorderRentalAssets("backdrop", form);
}

export async function reorderProps(
  _previous: { error?: string; success?: string },
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  return reorderRentalAssets("prop", form);
}

async function reorderRentalAssets(
  assetType: "backdrop" | "prop",
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  const rawIds = String(form.get("ids") ?? "[]");
  let ids: string[] = [];

  try {
    ids = JSON.parse(rawIds) as string[];
  } catch {
    return { error: "Dữ liệu sắp xếp không hợp lệ." };
  }

  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.some((id) => typeof id !== "string" || !id.trim())
  ) {
    return { error: "Danh sách sắp xếp không hợp lệ." };
  }

  const session = await requireAdmin().catch(() => null);

  if (!session) {
    return { error: "Vui lòng đăng nhập lại." };
  }

  const { error } = await session.db.rpc("reorder_rental_assets", {
    p_asset_type: assetType,
    p_ids: ids,
  });

  if (error) {
    if (["42883", "PGRST202"].includes(error.code || "")) {
      return {
        error:
          "Chưa có hàm sắp xếp nhanh cho Phông / Đạo cụ. Hãy chạy migration 120_admin_performance_v2.sql.",
      };
    }

    return { error: "Không thể cập nhật thứ tự hiển thị." };
  }

  refreshPublicCatalog();

  return { success: "Đã cập nhật thứ tự hiển thị." };
}

