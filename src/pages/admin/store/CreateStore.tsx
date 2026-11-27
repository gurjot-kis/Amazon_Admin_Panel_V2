import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
} from "../../../features/store/storeApi";
import type {
  StoreDay,
  StoreStatus,
  StoreTiming,
  UpdateStorePayload,
} from "../../../features/store/storeTypes";
import "../../../styles/store/CreateStore.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import TimePicker from "../../../components/common/TimePicker";
import { useNavigate } from "react-router-dom";
import CountryCodeSelect from "../../../components/common/CountryCodeSelect";

const DAYS: { key: StoreDay; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const MAX_IMAGE_MB = 4;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;

const buildDefaultTimings = (): StoreTiming[] =>
  DAYS.map(({ key }) => ({
    day: key,
    is_closed: key === "sunday",
    open_time: key === "sunday" ? "" : "09:00",
    close_time: key === "sunday" ? "" : "21:00",
  }));

interface StoreFormState {
  store_name: string;
  store_description: string;
  email: string;
  countryCode: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  gst_number: string;
  status: StoreStatus;
  timings: StoreTiming[];
  store_logo: File | null;
  store_banner: File | null;
}

const createInitialForm = (): StoreFormState => ({
  store_name: "",
  store_description: "",
  email: "",
  countryCode: "+91",
  phone: "",
  address: "",
  country: "India",
  state: "",
  city: "",
  postal_code: "",
  latitude: "",
  longitude: "",
  gst_number: "",
  status: "active",
  timings: buildDefaultTimings(),
  store_logo: null,
  store_banner: null,
});

const resolveAssetUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const base = (import.meta.env.VITE_API_ASSET_URL || "").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

interface DropzoneFieldProps {
  id: string;
  label: string;
  hint: string;
  previewUrl: string | null;
  error: string | null;
  variant?: "banner" | "logo";
  disabled?: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

const DropzoneField: React.FC<DropzoneFieldProps> = ({
  id,
  label,
  hint,
  previewUrl,
  error,
  variant = "banner",
  disabled,
  onSelectFile,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleIncomingFile = (file?: File | null) => {
    // Always clear input value first so re-selecting/dropping the same file fires change/drop cleanly
    resetInput();
    if (!file) return;
    onSelectFile(file);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetInput();
    setIsDragging(false);
    onRemove();
  };

  return (
    <div className="st-field">
      <label htmlFor={id}>{label}</label>
      <div
        className={`st-dropzone st-dropzone--${variant} ${
          isDragging ? "is-dragging" : ""
        } ${error ? "is-invalid" : ""} ${disabled ? "is-disabled" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          resetInput();
          inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            resetInput();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !isDragging) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (disabled) return;
          const droppedFile = e.dataTransfer.files?.[0];
          handleIncomingFile(droppedFile);
        }}
      >
        {previewUrl ? (
          <div className="st-dropzone-preview">
            <img src={previewUrl} alt={`${label} preview`} />
            <div className="st-dropzone-overlay">
              <span className="st-dropzone-replace">Replace</span>
              <button
                type="button"
                className="st-remove-btn"
                onClick={handleRemoveClick}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="st-dropzone-empty">
            <span className="st-dropzone-icon" aria-hidden="true">
              ⤒
            </span>
            <p className="st-dropzone-title">
              Drag &amp; drop or click to choose {label.toLowerCase()}
            </p>
            <p className="st-dropzone-hint">{hint}</p>
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="st-sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleIncomingFile(e.target.files?.[0]);
          }}
        />
      </div>
      {error && <div className="st-error">{error}</div>}
    </div>
  );
};

const Spinner: React.FC = () => (
  <span className="st-spinner" aria-hidden="true" />
);

const CreateStore: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: storeRes,
    isLoading: isFetchingStore,
    refetch,
  } = useGetStoreQuery();
  const [createStore, { isLoading: isCreating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const existingStore = storeRes?.data ?? null;
  const isEditMode = Boolean(existingStore?._id);
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<StoreFormState>(createInitialForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Revoke object URLs on change/unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:"))
        URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  // Populate form when existing store data arrives
  useEffect(() => {
    if (!existingStore) return;

    const coords = existingStore.location?.coordinates;
    const lng =
      Array.isArray(coords) && coords.length === 2 ? String(coords[0]) : "";
    const lat =
      Array.isArray(coords) && coords.length === 2 ? String(coords[1]) : "";

    const mergedTimings: StoreTiming[] = DAYS.map(({ key }) => {
      const found = existingStore.timings?.find((t) => t.day === key);
      if (found) {
        return {
          day: key,
          is_closed: Boolean(found.is_closed),
          open_time: found.is_closed ? "" : found.open_time || "09:00",
          close_time: found.is_closed ? "" : found.close_time || "21:00",
        };
      }
      return {
        day: key,
        is_closed: key === "sunday",
        open_time: key === "sunday" ? "" : "09:00",
        close_time: key === "sunday" ? "" : "21:00",
      };
    });

    setForm({
      store_name: existingStore.store_name || "",
      store_description: existingStore.store_description || "",
      email: existingStore.email || "",
      countryCode: existingStore.countryCode || "+91",
      phone: existingStore.phone || "",
      address: existingStore.address || "",
      country: existingStore.country || "India",
      state: existingStore.state || "",
      city: existingStore.city || "",
      postal_code: existingStore.postal_code || "",
      latitude: lat,
      longitude: lng,
      gst_number: existingStore.gst_number || "",
      status: existingStore.status || "active",
      timings: mergedTimings,
      store_logo: null,
      store_banner: null,
    });

    setLogoPreview(resolveAssetUrl(existingStore.store_logo));
    setBannerPreview(resolveAssetUrl(existingStore.store_banner));
    setRemoveLogo(false);
    setRemoveBanner(false);
    setLogoError(null);
    setBannerError(null);
    setTouched({});
    setSubmitAttempted(false);
  }, [existingStore]);

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed (PNG, JPG, WEBP).";
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return `File size must be ${MAX_IMAGE_MB}MB or smaller.`;
    }
    return null;
  };

  const handleLogoSelect = (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setLogoError(err);
      return;
    }
    setLogoError(null);
    setRemoveLogo(false);
    setForm((prev) => ({ ...prev, store_logo: file }));
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoRemove = () => {
    setForm((prev) => ({ ...prev, store_logo: null }));
    setLogoPreview(null);
    setLogoError(null);
    if (isEditMode) {
      setRemoveLogo(true);
    }
  };

  const handleBannerSelect = (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setBannerError(err);
      return;
    }
    setBannerError(null);
    setRemoveBanner(false);
    setForm((prev) => ({ ...prev, store_banner: file }));
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleBannerRemove = () => {
    setForm((prev) => ({ ...prev, store_banner: null }));
    setBannerPreview(null);
    setBannerError(null);
    if (isEditMode) {
      setRemoveBanner(true);
    }
  };

  const updateTimingDay = (day: StoreDay, patch: Partial<StoreTiming>) => {
    setForm((prev) => ({
      ...prev,
      timings: prev.timings.map((item) => {
        if (item.day !== day) return item;
        const next: StoreTiming = { ...item, ...patch };
        if (patch.is_closed === true) {
          next.open_time = "";
          next.close_time = "";
        } else if (patch.is_closed === false) {
          next.open_time = next.open_time || "09:00";
          next.close_time = next.close_time || "21:00";
        }
        return next;
      }),
    }));
  };

  const applyAllDaysHours = (open_time: string, close_time: string) => {
    setForm((prev) => ({
      ...prev,
      timings: prev.timings.map((item) =>
        item.is_closed ? item : { ...item, open_time, close_time },
      ),
    }));
  };

  const timingErrors = useMemo(() => {
    const map: Record<string, string> = {};
    form.timings.forEach((t) => {
      if (t.is_closed) return;
      const open = (t.open_time || "").trim();
      const close = (t.close_time || "").trim();
      if (!TIME_RE.test(open) || !TIME_RE.test(close)) {
        map[t.day] = "Enter valid 24h HH:MM times.";
      } else if (open >= close) {
        map[t.day] = "Closing time must be after opening time.";
      }
    });
    return map;
  }, [form.timings]);

  const latNum = Number(form.latitude);
  const lngNum = Number(form.longitude);
  const hasLat = form.latitude.trim() !== "";
  const hasLng = form.longitude.trim() !== "";

  const fieldErrors = useMemo(() => {
    const show = (key: string) => Boolean(touched[key] || submitAttempted);

    const nameErr = !form.store_name.trim()
      ? "Store name is required."
      : form.store_name.trim().length < 2
        ? "Store name must be at least 2 characters."
        : "";

    const addressErr = !form.address.trim()
      ? "Street address is required."
      : "";

    const emailErr =
      form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())
        ? "Enter a valid email address."
        : "";

    const phoneErr =
      form.phone.trim() && !/^\+?[0-9\s\-()]{7,15}$/.test(form.phone.trim())
        ? "Enter a valid phone number (7–15 digits)."
        : "";

    const countryCodeErr = !/^\+?\d{1,4}$/.test(form.countryCode.trim())
      ? "Invalid code (e.g. +91)."
      : "";

    const gstErr =
      form.gst_number.trim() &&
      !GST_RE.test(form.gst_number.trim().toUpperCase())
        ? "Invalid 15-character GSTIN format."
        : "";

    let locationErr = "";
    if (!isEditMode && (!hasLat || !hasLng)) {
      locationErr = "Both latitude and longitude are required.";
    } else if (hasLat !== hasLng) {
      locationErr = "Provide both latitude and longitude together.";
    } else if (
      hasLat &&
      (!Number.isFinite(latNum) || latNum < -90 || latNum > 90)
    ) {
      locationErr = "Latitude must be between -90 and 90.";
    } else if (
      hasLng &&
      (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180)
    ) {
      locationErr = "Longitude must be between -180 and 180.";
    }

    return {
      store_name: show("store_name") ? nameErr : "",
      address: show("address") ? addressErr : "",
      email: show("email") ? emailErr : "",
      phone: show("phone") ? phoneErr : "",
      countryCode: show("countryCode") ? countryCodeErr : "",
      gst_number: show("gst_number") ? gstErr : "",
      location:
        show("latitude") || show("longitude") || submitAttempted
          ? locationErr
          : "",
      raw: {
        nameErr,
        addressErr,
        emailErr,
        phoneErr,
        countryCodeErr,
        gstErr,
        locationErr,
      },
    };
  }, [
    form,
    touched,
    submitAttempted,
    isEditMode,
    hasLat,
    hasLng,
    latNum,
    lngNum,
  ]);

  const hasTimingErrors = Object.keys(timingErrors).length > 0;
  const isFormValid =
    !fieldErrors.raw.nameErr &&
    !fieldErrors.raw.addressErr &&
    !fieldErrors.raw.emailErr &&
    !fieldErrors.raw.phoneErr &&
    !fieldErrors.raw.countryCodeErr &&
    !fieldErrors.raw.gstErr &&
    !fieldErrors.raw.locationErr &&
    !logoError &&
    !bannerError &&
    !hasTimingErrors;

  const markTouched = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleReset = () => {
    if (existingStore) {
      refetch();
    } else {
      setForm(createInitialForm());
      setLogoPreview(null);
      setBannerPreview(null);
      setLogoError(null);
      setBannerError(null);
      setRemoveLogo(false);
      setRemoveBanner(false);
      setTouched({});
      setSubmitAttempted(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    const normalizedCode = form.countryCode.trim().startsWith("+")
      ? form.countryCode.trim()
      : `+${form.countryCode.trim()}`;

    const sanitizedTimings: StoreTiming[] = form.timings.map((t) =>
      t.is_closed
        ? { day: t.day, is_closed: true, open_time: "", close_time: "" }
        : {
            day: t.day,
            is_closed: false,
            open_time: (t.open_time || "").trim(),
            close_time: (t.close_time || "").trim(),
          },
    );

    try {
      if (isEditMode) {
        const payload: UpdateStorePayload = {
          store_name: form.store_name.trim(),
          store_description: form.store_description.trim(),
          email: form.email.trim(),
          countryCode: normalizedCode,
          phone: form.phone.trim(),
          address: form.address.trim(),
          country: form.country.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          gst_number: form.gst_number.trim().toUpperCase(),
          timings: sanitizedTimings,
          ...(hasLat && hasLng
            ? {
                latitude: form.latitude.trim(),
                longitude: form.longitude.trim(),
              }
            : {}),
          ...(form.store_logo ? { store_logo: form.store_logo } : {}),
          ...(form.store_banner ? { store_banner: form.store_banner } : {}),
          ...(removeLogo && !form.store_logo ? { remove_logo: true } : {}),
          ...(removeBanner && !form.store_banner
            ? { remove_banner: true }
            : {}),
        };

        await updateStore(payload).unwrap();
        toast.success("Store updated", {
          description: `"${form.store_name.trim()}" details have been saved.`,
        });
        navigate("/admin/store");
      } else {
        await createStore({
          store_name: form.store_name.trim(),
          store_description: form.store_description.trim(),
          email: form.email.trim(),
          countryCode: normalizedCode,
          phone: form.phone.trim(),
          address: form.address.trim(),
          country: form.country.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          gst_number: form.gst_number.trim().toUpperCase(),
          latitude: form.latitude.trim(),
          longitude: form.longitude.trim(),
          timings: sanitizedTimings,
          ...(form.store_logo ? { store_logo: form.store_logo } : {}),
          ...(form.store_banner ? { store_banner: form.store_banner } : {}),
        }).unwrap();

        toast.success("Store created", {
          description: `"${form.store_name.trim()}" is now configured.`,
        });
        navigate("/admin/store");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      toast.error(
        isEditMode ? "Failed to update store" : "Failed to create store",
        {
          description:
            apiErr?.data?.message || apiErr?.message || "Please try again.",
        },
      );
    }
  };

  if (isFetchingStore) {
    return (
      <FullScreenLoader
        title="Loading Store Profile"
        subtitle="Fetching store configuration..."
      />
    );
  }

  const locationSummary = [
    form.address.trim(),
    form.city.trim(),
    form.state.trim(),
    form.postal_code.trim(),
    form.country.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const openDaysCount = form.timings.filter((t) => !t.is_closed).length;

  return (
    <div className="st-page">
      <div className="container-fluid st-container">
        <div className="st-header">
          <div>
            <p className="st-eyebrow">Store Setup</p>
            <h1 className="st-title">
              {isEditMode ? "Manage Store" : "Create Store"}
            </h1>
            <p className="st-subtitle">
              {isEditMode
                ? "Update storefront branding, contact info, location, and operating hours."
                : "Configure your storefront details, branding assets, location coordinates, and timings."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} onReset={handleReset} noValidate>
          <fieldset className="st-fieldset" disabled={isSubmitting}>
            <div className="row g-4 st-body">
              {/* Left Column: Section-wise Form */}
              <div className="col-12 col-lg-8">
                {/* Section 01: Store Identity */}
                <section className="st-card">
                  <header className="st-card-header">
                    <span className="st-card-index">01</span>
                    <div>
                      <h2>Store identity</h2>
                      <p>
                        Core business name, description, and tax identifier.
                      </p>
                    </div>
                  </header>

                  <div className="st-field">
                    <label htmlFor="st-name">
                      Store name <span className="st-required">*</span>
                    </label>
                    <input
                      id="st-name"
                      type="text"
                      maxLength={100}
                      className={`form-control st-input ${
                        fieldErrors.store_name ? "is-invalid" : ""
                      }`}
                      placeholder="e.g. Evermart Flagship Store"
                      value={form.store_name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, store_name: e.target.value }))
                      }
                      onBlur={() => markTouched("store_name")}
                    />
                    {fieldErrors.store_name && (
                      <div className="st-error">{fieldErrors.store_name}</div>
                    )}
                  </div>

                  <div className="st-field">
                    <label htmlFor="st-description">Description</label>
                    <textarea
                      id="st-description"
                      rows={3}
                      maxLength={1000}
                      className="form-control st-input st-textarea"
                      placeholder="Short summary of products, specialties, or service highlights..."
                      value={form.store_description}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          store_description: e.target.value,
                        }))
                      }
                    />
                    <div className="st-field-footer">
                      <span className="st-hint">
                        Displayed on your storefront profile.
                      </span>
                      <span className="st-count">
                        {form.store_description.length}/1000
                      </span>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-gst">GST Number</label>
                        <input
                          id="st-gst"
                          type="text"
                          maxLength={15}
                          className={`form-control st-input st-input--upper ${
                            fieldErrors.gst_number ? "is-invalid" : ""
                          }`}
                          placeholder="e.g. 07AABCU9603R1ZM"
                          value={form.gst_number}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              gst_number: e.target.value.toUpperCase(),
                            }))
                          }
                          onBlur={() => markTouched("gst_number")}
                        />
                        {fieldErrors.gst_number && (
                          <div className="st-error">
                            {fieldErrors.gst_number}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-status">Store Status</label>
                        <select
                          id="st-status"
                          className="form-select st-input"
                          value={form.status}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              status: e.target.value as StoreStatus,
                            }))
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 02: Contact Information */}
                <section className="st-card">
                  <header className="st-card-header">
                    <span className="st-card-index">02</span>
                    <div>
                      <h2>Contact details</h2>
                      <p>Customer support email and phone number.</p>
                    </div>
                  </header>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-email">Support email</label>
                        <input
                          id="st-email"
                          type="email"
                          className={`form-control st-input ${
                            fieldErrors.email ? "is-invalid" : ""
                          }`}
                          placeholder="store@example.com"
                          value={form.email}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                          }
                          onBlur={() => markTouched("email")}
                        />
                        {fieldErrors.email && (
                          <div className="st-error">{fieldErrors.email}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-phone">Phone number</label>
                        <div className="st-phone-row">
                          <CountryCodeSelect
                            ariaLabel="Country code"
                            value={form.countryCode}
                            isInvalid={Boolean(fieldErrors.countryCode)}
                            disabled={isSubmitting}
                            onChange={(dialCode) =>
                              setForm((p) => ({
                                ...p,
                                countryCode: dialCode,
                              }))
                            }
                            onBlur={() => markTouched("countryCode")}
                          />
                          <input
                            id="st-phone"
                            type="tel"
                            maxLength={15}
                            className={`form-control st-input ${
                              fieldErrors.phone ? "is-invalid" : ""
                            }`}
                            placeholder="9876543210"
                            value={form.phone}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, phone: e.target.value }))
                            }
                            onBlur={() => markTouched("phone")}
                          />
                        </div>
                        {(fieldErrors.countryCode || fieldErrors.phone) && (
                          <div className="st-error">
                            {fieldErrors.countryCode || fieldErrors.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 03: Address & Geo Coordinates */}
                <section className="st-card">
                  <header className="st-card-header">
                    <span className="st-card-index">03</span>
                    <div>
                      <h2>Location &amp; coordinates</h2>
                      <p>
                        Physical address and geo-coordinates used for nearby
                        store and delivery calculations.
                      </p>
                    </div>
                  </header>

                  <div className="st-field">
                    <label htmlFor="st-address">
                      Street address <span className="st-required">*</span>
                    </label>
                    <input
                      id="st-address"
                      type="text"
                      className={`form-control st-input ${
                        fieldErrors.address ? "is-invalid" : ""
                      }`}
                      placeholder="Plot / Building, Street, Landmark"
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      onBlur={() => markTouched("address")}
                    />
                    {fieldErrors.address && (
                      <div className="st-error">{fieldErrors.address}</div>
                    )}
                  </div>

                  <div className="row g-3 st-field">
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="st-city">City</label>
                      <input
                        id="st-city"
                        type="text"
                        className="form-control st-input"
                        placeholder="Mohali"
                        value={form.city}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="st-state">State</label>
                      <input
                        id="st-state"
                        type="text"
                        className="form-control st-input"
                        placeholder="Punjab"
                        value={form.state}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, state: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="st-postal">Postal code</label>
                      <input
                        id="st-postal"
                        type="text"
                        className="form-control st-input"
                        placeholder="160055"
                        value={form.postal_code}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            postal_code: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label htmlFor="st-country">Country</label>
                      <input
                        id="st-country"
                        type="text"
                        className="form-control st-input"
                        placeholder="India"
                        value={form.country}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, country: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-lat">
                          Latitude{" "}
                          {!isEditMode && (
                            <span className="st-required">*</span>
                          )}
                        </label>
                        <input
                          id="st-lat"
                          type="number"
                          step="any"
                          min={-90}
                          max={90}
                          className={`form-control st-input ${
                            fieldErrors.location ? "is-invalid" : ""
                          }`}
                          placeholder="e.g. 30.7046"
                          value={form.latitude}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, latitude: e.target.value }))
                          }
                          onBlur={() => markTouched("latitude")}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="st-field st-field--compact">
                        <label htmlFor="st-lng">
                          Longitude{" "}
                          {!isEditMode && (
                            <span className="st-required">*</span>
                          )}
                        </label>
                        <input
                          id="st-lng"
                          type="number"
                          step="any"
                          min={-180}
                          max={180}
                          className={`form-control st-input ${
                            fieldErrors.location ? "is-invalid" : ""
                          }`}
                          placeholder="e.g. 76.7179"
                          value={form.longitude}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              longitude: e.target.value,
                            }))
                          }
                          onBlur={() => markTouched("longitude")}
                        />
                      </div>
                    </div>
                  </div>
                  {fieldErrors.location && (
                    <div className="st-error">{fieldErrors.location}</div>
                  )}
                </section>

                {/* Section 04: Branding Assets (Drag & Drop) */}
                <section className="st-card">
                  <header className="st-card-header">
                    <span className="st-card-index">04</span>
                    <div>
                      <h2>Store logo &amp; banner</h2>
                      <p>
                        Drag and drop images or click to browse. Removing an
                        image resets the picker so you can re-add the same file.
                      </p>
                    </div>
                  </header>

                  <DropzoneField
                    id="st-banner-input"
                    label="Store banner"
                    hint={`Wide landscape recommended · PNG, JPG, WEBP up to ${MAX_IMAGE_MB}MB`}
                    previewUrl={bannerPreview}
                    error={bannerError}
                    variant="banner"
                    disabled={isSubmitting}
                    onSelectFile={handleBannerSelect}
                    onRemove={handleBannerRemove}
                  />

                  <DropzoneField
                    id="st-logo-input"
                    label="Store logo"
                    hint={`Square icon recommended · PNG, JPG, WEBP up to ${MAX_IMAGE_MB}MB`}
                    previewUrl={logoPreview}
                    error={logoError}
                    variant="logo"
                    disabled={isSubmitting}
                    onSelectFile={handleLogoSelect}
                    onRemove={handleLogoRemove}
                  />
                </section>

                {/* Section 05: Store Timings */}
                <section className="st-card">
                  <header className="st-card-header st-card-header--split">
                    <div className="st-card-header-left">
                      <span className="st-card-index">05</span>
                      <div>
                        <h2>Operating hours</h2>
                        <p>24-hour format (HH:MM) for each day of the week.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() => applyAllDaysHours("09:00", "21:00")}
                    >
                      Set open days 09:00–21:00
                    </button>
                  </header>

                  <div className="st-timings-list">
                    {form.timings.map((slot) => {
                      const dayMeta = DAYS.find((d) => d.key === slot.day);
                      const rowErr = timingErrors[slot.day];

                      return (
                        <div key={slot.day} className="st-timing-row">
                          <div className="st-timing-day">
                            <span>{dayMeta?.label ?? slot.day}</span>
                          </div>

                          <label className="st-closed-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(slot.is_closed)}
                              onChange={(e) =>
                                updateTimingDay(slot.day, {
                                  is_closed: e.target.checked,
                                })
                              }
                            />
                            <span>Closed</span>
                          </label>

                          {slot.is_closed ? (
                            <div className="st-timing-closed-pill">
                              Closed all day
                            </div>
                          ) : (
                            <div className="st-timing-times">
                              <TimePicker
                                ariaLabel={`${dayMeta?.label} opening time`}
                                value={slot.open_time || ""}
                                isInvalid={Boolean(rowErr)}
                                onChange={(val) =>
                                  updateTimingDay(slot.day, {
                                    open_time: val,
                                  })
                                }
                              />
                              <span className="st-time-sep">to</span>
                              <TimePicker
                                ariaLabel={`${dayMeta?.label} closing time`}
                                value={slot.close_time || ""}
                                isInvalid={Boolean(rowErr)}
                                onChange={(val) =>
                                  updateTimingDay(slot.day, {
                                    close_time: val,
                                  })
                                }
                              />
                            </div>
                          )}

                          {rowErr && (
                            <div className="st-error st-timing-err">
                              {rowErr}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Form Actions */}
                <div className="st-actions">
                  <button type="reset" className="btn st-btn-ghost">
                    {isEditMode ? "Reset changes" : "Clear form"}
                  </button>
                  <button
                    type="submit"
                    className="btn st-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating store…"
                        : "Creating store…"
                      : isEditMode
                        ? "Update store"
                        : "Create store"}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Preview Card */}
              <div className="col-12 col-lg-4">
                <div className="st-sticky">
                  <div className="st-preview-card">
                    <div className="st-preview-top">
                      <span className="st-preview-label">Live preview</span>
                      <span className={`st-status-badge is-${form.status}`}>
                        {form.status}
                      </span>
                    </div>

                    <div className="st-storefront-card">
                      <div className="st-storefront-banner">
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Store banner" />
                        ) : (
                          <span className="st-banner-placeholder">
                            Store banner preview
                          </span>
                        )}
                      </div>

                      <div className="st-storefront-body">
                        <div className="st-storefront-head">
                          <div className="st-storefront-logo">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Store logo" />
                            ) : (
                              <span>
                                {(
                                  form.store_name.trim()[0] || "S"
                                ).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="st-storefront-titles">
                            <h3 className="st-storefront-name">
                              {form.store_name.trim() || "Your Store Name"}
                            </h3>
                            <p className="st-storefront-meta">
                              {openDaysCount} of 7 days open
                            </p>
                          </div>
                        </div>

                        <p className="st-storefront-desc">
                          {form.store_description.trim() ||
                            "Store description will appear here as you type."}
                        </p>

                        <div className="st-preview-details">
                          <div className="st-preview-row">
                            <span className="st-preview-key">Address</span>
                            <span className="st-preview-val">
                              {locationSummary || "No address entered yet"}
                            </span>
                          </div>

                          {(form.email.trim() || form.phone.trim()) && (
                            <div className="st-preview-row">
                              <span className="st-preview-key">Contact</span>
                              <span className="st-preview-val">
                                {[
                                  form.phone.trim()
                                    ? `${form.countryCode.trim() || "+91"} ${form.phone.trim()}`
                                    : "",
                                  form.email.trim(),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </div>
                          )}

                          {form.gst_number.trim() && (
                            <div className="st-preview-row">
                              <span className="st-preview-key">GSTIN</span>
                              <span className="st-preview-val st-mono">
                                {form.gst_number.trim().toUpperCase()}
                              </span>
                            </div>
                          )}

                          {hasLat && hasLng && (
                            <div className="st-preview-row">
                              <span className="st-preview-key">Coords</span>
                              <span className="st-preview-val st-mono">
                                {latNum.toFixed(4)}, {lngNum.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;
