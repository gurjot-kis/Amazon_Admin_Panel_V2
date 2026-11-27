import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetStoreQuery,
  useDeleteStoreMutation,
} from "../../../features/store/storeApi";
import type { StoreDay, StoreTiming } from "../../../features/store/storeTypes";
import "../../../styles/store/StoreCard.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const DAY_ORDER: { key: StoreDay; label: string; short: string }[] = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

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

const formatDateTime = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTodayDayKey = (): StoreDay => {
  const idx = new Date().getDay(); // 0 = Sun ... 6 = Sat
  const map: StoreDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[idx];
};

const Store: React.FC = () => {
  const navigate = useNavigate();
  const { data: storeRes, isLoading, isError, refetch } = useGetStoreQuery();
  const [deleteStore, { isLoading: isDeleting }] = useDeleteStoreMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const store = storeRes?.data ?? null;
  const todayKey = useMemo(() => getTodayDayKey(), []);

  const orderedTimings = useMemo<StoreTiming[]>(() => {
    const raw = store?.timings ?? [];
    return DAY_ORDER.map(({ key }) => {
      const match = raw.find((t) => t.day === key);
      if (match) return match;
      return {
        day: key,
        is_closed: true,
        open_time: "",
        close_time: "",
      };
    });
  }, [store?.timings]);

  const todayTiming = useMemo(
    () => orderedTimings.find((t) => t.day === todayKey),
    [orderedTimings, todayKey],
  );

  const openDaysCount = useMemo(
    () => orderedTimings.filter((t) => !t.is_closed).length,
    [orderedTimings],
  );

  const bannerUrl = resolveAssetUrl(store?.store_banner);
  const logoUrl = resolveAssetUrl(store?.store_logo);

  const coords = store?.location?.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length === 2;
  const longitude = hasCoords ? coords[0] : null;
  const latitude = hasCoords ? coords[1] : null;

  const fullAddress = useMemo(() => {
    if (!store) return "";
    return [
      store.address,
      store.city,
      store.state,
      store.postal_code,
      store.country,
    ]
      .filter((part) => Boolean(part && part.trim()))
      .join(", ");
  }, [store]);

  const formattedPhone = useMemo(() => {
    if (!store?.phone) return "";
    const code = (store.countryCode || "+91").trim();
    return `${code} ${store.phone.trim()}`;
  }, [store?.countryCode, store?.phone]);

  const handleCopy = (label: string, text?: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleDelete = async () => {
    try {
      await deleteStore().unwrap();
      toast.success("Store deleted successfully");
      setConfirmDelete(false);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      toast.error("Failed to delete store", {
        description:
          apiErr?.data?.message || apiErr?.message || "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <FullScreenLoader
        title="Loading Store"
        subtitle="Fetching your storefront showcase..."
      />
    );
  }

  if (isError) {
    return (
      <div className="sc-page">
        <div className="container-fluid sc-container">
          <div className="sc-empty-card">
            <div className="sc-empty-badge">Connection Issue</div>
            <h2>Couldn&apos;t load store details</h2>
            <p>There was a problem communicating with the server.</p>
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="sc-page">
        <div className="container-fluid sc-container">
          <div className="sc-empty-card">
            <div className="sc-empty-icon" aria-hidden="true">
              ✦
            </div>
            <h2>No store configured yet</h2>
            <p>
              Launch your flagship storefront with branding, geo-location,
              contact details, and weekly operating hours.
            </p>
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              onClick={() => navigate("/admin/store/add")}
            >
              Create Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <div className="container-fluid sc-container">
        {/* Top Page Header */}
        <div className="sc-topbar">
          <div>
            <p className="sc-eyebrow">Storefront Showcase</p>
            <h1 className="sc-page-title">Store Profile</h1>
          </div>

          <div className="sc-topbar-actions">
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              onClick={() => navigate("/admin/store/edit")}
            >
              Edit Store
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                className="sc-btn sc-btn--danger-outline"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            ) : (
              <div className="sc-confirm-group">
                <span className="sc-confirm-text">Delete store?</span>
                <button
                  type="button"
                  className="sc-btn sc-btn--danger"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  className="sc-btn sc-btn--ghost"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Premium Storefront Hero Card */}
        <article className="sc-hero-card">
          <div className="sc-banner-wrap">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`${store.store_name} banner`}
                className="sc-banner-img"
              />
            ) : (
              <div className="sc-banner-fallback">
                <span className="sc-banner-pattern" aria-hidden="true" />
                <span className="sc-banner-label">Flagship Storefront</span>
              </div>
            )}
            <div className="sc-banner-scrim" />

            <div className="sc-hero-badges">
              <span className={`sc-pill sc-pill--status is-${store.status}`}>
                <span className="sc-dot" />
                {store.status}
              </span>
              <span className="sc-pill sc-pill--hours">
                {todayTiming?.is_closed
                  ? "Closed Today"
                  : todayTiming?.open_time && todayTiming?.close_time
                    ? `Today: ${todayTiming.open_time} – ${todayTiming.close_time}`
                    : `${openDaysCount}/7 Days Open`}
              </span>
            </div>
          </div>

          <div className="sc-hero-body">
            <div className="sc-identity-row">
              <div className="sc-logo-frame">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${store.store_name} logo`}
                    className="sc-logo-img"
                  />
                ) : (
                  <span className="sc-logo-initial">
                    {(store.store_name.trim()[0] || "S").toUpperCase()}
                  </span>
                )}
              </div>

              <div className="sc-identity-meta">
                <div className="sc-name-line">
                  <h2 className="sc-store-name">{store.store_name}</h2>
                  {store.gst_number && (
                    <button
                      type="button"
                      className="sc-gst-chip"
                      title="Click to copy GSTIN"
                      onClick={() => handleCopy("GSTIN", store.gst_number)}
                    >
                      GSTIN: {store.gst_number}
                    </button>
                  )}
                </div>

                <p className="sc-store-desc">
                  {store.store_description?.trim() ||
                    "No store description added yet."}
                </p>
              </div>
            </div>

            {/* Quick Highlights Strip */}
            <div className="sc-highlights-grid">
              <div className="sc-highlight-box">
                <span className="sc-highlight-label">Operating Schedule</span>
                <span className="sc-highlight-value">
                  {openDaysCount} of 7 days open
                </span>
              </div>

              <div className="sc-highlight-box">
                <span className="sc-highlight-label">Geo Coordinates</span>
                <span className="sc-highlight-value sc-mono">
                  {latitude !== null && longitude !== null
                    ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                    : "Not configured"}
                </span>
              </div>

              <div className="sc-highlight-box">
                <span className="sc-highlight-label">Tax Registration</span>
                <span className="sc-highlight-value sc-mono">
                  {store.gst_number || "Not provided"}
                </span>
              </div>

              <div className="sc-highlight-box">
                <span className="sc-highlight-label">Last Updated</span>
                <span className="sc-highlight-value">
                  {formatDateTime(store.updatedAt || store.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Detailed Information Grid */}
        <div className="row g-4 sc-details-grid">
          {/* Left Column: Contact, Address & Location */}
          <div className="col-12 col-xl-7">
            <section className="sc-panel">
              <div className="sc-panel-head">
                <span className="sc-panel-tag">01</span>
                <div>
                  <h3>Contact &amp; Communication</h3>
                  <p>Direct channels associated with this store</p>
                </div>
              </div>

              <div className="sc-info-list">
                <div className="sc-info-item">
                  <span className="sc-info-key">Support Email</span>
                  <div className="sc-info-val-wrap">
                    <span className="sc-info-val">
                      {store.email || "Not provided"}
                    </span>
                    {store.email && (
                      <button
                        type="button"
                        className="sc-copy-btn"
                        onClick={() => handleCopy("Email", store.email)}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div className="sc-info-item">
                  <span className="sc-info-key">Phone Number</span>
                  <div className="sc-info-val-wrap">
                    <span className="sc-info-val sc-mono">
                      {formattedPhone || "Not provided"}
                    </span>
                    {formattedPhone && (
                      <button
                        type="button"
                        className="sc-copy-btn"
                        onClick={() => handleCopy("Phone", formattedPhone)}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-panel-head">
                <span className="sc-panel-tag">02</span>
                <div>
                  <h3>Address &amp; Geospatial Location</h3>
                  <p>Delivery hub address and 2dsphere map coordinates</p>
                </div>
              </div>

              <div className="sc-address-banner">
                <div className="sc-address-main">
                  <span className="sc-address-title">Full Address</span>
                  <p className="sc-address-text">
                    {fullAddress || "No address available"}
                  </p>
                </div>
                {fullAddress && (
                  <button
                    type="button"
                    className="sc-copy-btn"
                    onClick={() => handleCopy("Address", fullAddress)}
                  >
                    Copy
                  </button>
                )}
              </div>

              <div className="sc-subfields-grid">
                <div className="sc-subfield">
                  <span className="sc-subfield-label">Street Address</span>
                  <span className="sc-subfield-val">
                    {store.address || "—"}
                  </span>
                </div>
                <div className="sc-subfield">
                  <span className="sc-subfield-label">City</span>
                  <span className="sc-subfield-val">{store.city || "—"}</span>
                </div>
                <div className="sc-subfield">
                  <span className="sc-subfield-label">State</span>
                  <span className="sc-subfield-val">{store.state || "—"}</span>
                </div>
                <div className="sc-subfield">
                  <span className="sc-subfield-label">Postal Code</span>
                  <span className="sc-subfield-val sc-mono">
                    {store.postal_code || "—"}
                  </span>
                </div>
                <div className="sc-subfield">
                  <span className="sc-subfield-label">Country</span>
                  <span className="sc-subfield-val">
                    {store.country || "—"}
                  </span>
                </div>
                <div className="sc-subfield">
                  <span className="sc-subfield-label">
                    Latitude / Longitude
                  </span>
                  <span className="sc-subfield-val sc-mono">
                    {latitude !== null && longitude !== null
                      ? `${latitude}, ${longitude}`
                      : "—"}
                  </span>
                </div>
              </div>

              {latitude !== null && longitude !== null && (
                <div className="sc-map-link-row">
                  <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sc-map-link"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Weekly Operating Hours & Record Meta */}
          <div className="col-12 col-xl-5">
            <section className="sc-panel sc-panel--full">
              <div className="sc-panel-head">
                <span className="sc-panel-tag">03</span>
                <div>
                  <h3>Weekly Operating Hours</h3>
                  <p>24-hour schedule across all 7 days</p>
                </div>
              </div>

              <div className="sc-hours-list">
                {orderedTimings.map((slot) => {
                  const meta = DAY_ORDER.find((d) => d.key === slot.day);
                  const isToday = slot.day === todayKey;

                  return (
                    <div
                      key={slot.day}
                      className={`sc-hour-row ${isToday ? "is-today" : ""} ${
                        slot.is_closed ? "is-closed" : ""
                      }`}
                    >
                      <div className="sc-hour-day">
                        <span>{meta?.label ?? slot.day}</span>
                        {isToday && (
                          <span className="sc-today-badge">Today</span>
                        )}
                      </div>

                      {slot.is_closed ? (
                        <span className="sc-closed-tag">Closed</span>
                      ) : (
                        <span className="sc-time-range sc-mono">
                          {slot.open_time || "--:--"} –{" "}
                          {slot.close_time || "--:--"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sc-meta-footer">
                <div className="sc-meta-cell">
                  <span className="sc-meta-key">Store ID</span>
                  <button
                    type="button"
                    className="sc-id-copy"
                    title="Copy Store ID"
                    onClick={() => handleCopy("Store ID", store._id)}
                  >
                    <span className="sc-mono">{store._id}</span>
                  </button>
                </div>
                <div className="sc-meta-cell">
                  <span className="sc-meta-key">Created On</span>
                  <span className="sc-meta-val">
                    {formatDateTime(store.createdAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
