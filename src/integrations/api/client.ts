import type { ApiDatabase } from "./types";

type ApiUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  roles?: string[];
  profile?: Record<string, unknown>;
};
type ApiError = { message: string; status?: number };
type Filter = { field: string; op: string; value: unknown };
type ApiTable = keyof ApiDatabase["public"]["Tables"];
type ApiRow<T extends ApiTable> = ApiDatabase["public"]["Tables"][T]["Row"];
type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL || "https://ana-refi-backend.ethiodeploy.app/api/v1"
).replace(/\/$/, "");
const TOKEN_KEY = "ana-refi-api-token";
const USER_KEY = "ana-refi-api-user";
const listeners = new Set<(event: string, session: ApiSession | null) => void>();
const uploads = new Map<string, string>();

type ApiSession = { access_token: string; token_type: "Bearer"; user: ApiUser };

function sessionValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.sessionStorage.getItem(key);
    if (current !== null) return current;
    const previous = window.localStorage.getItem(key);
    if (previous !== null) {
      window.sessionStorage.setItem(key, previous);
      window.localStorage.removeItem(key);
    }
    return previous;
  } catch {
    return null;
  }
}

function storedToken(): string | null {
  return sessionValue(TOKEN_KEY);
}

function storedUser(): ApiUser | null {
  try {
    return JSON.parse(sessionValue(USER_KEY) || "null") as ApiUser | null;
  } catch {
    return null;
  }
}

function storeSession(session: ApiSession | null) {
  if (typeof window === "undefined") return;
  const previousUser = storedUser();
  const userChanged = session
    ? JSON.stringify(previousUser) !== JSON.stringify(session.user)
    : previousUser !== null;
  if (session) {
    window.sessionStorage.setItem(TOKEN_KEY, session.access_token);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } else {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  }
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Session storage remains the active token store.
  }
  if (userChanged) {
    for (const listener of listeners) listener(session ? "SIGNED_IN" : "SIGNED_OUT", session);
  }
}

async function request(path: string, init: RequestInit = {}, tokenOverride?: string) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const token = tokenOverride ?? storedToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const validation = body?.errors ? Object.values(body.errors).flat().join(" ") : "";
    throw Object.assign(
      new Error(validation || body?.message || `API request failed (${response.status})`),
      { status: response.status },
    );
  }
  return body;
}

/** Shared Laravel API transport. Resource helpers below preserve pagination metadata. */
export const api = {
  get: <T>(path: string) => request(path, { method: "GET" }) as Promise<T>,
  post: <T>(path: string, body?: unknown) =>
    request(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }) as Promise<T>,
  put: <T>(path: string, body?: unknown) =>
    request(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }) as Promise<T>,
  patch: <T>(path: string, body?: unknown) =>
    request(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }) as Promise<T>,
  delete: (path: string) => request(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request(path, { method: "POST", body: form }) as Promise<T>,
};

function payload<T>(body: unknown): T {
  const value = body as { data?: T } | null;
  return value && Object.prototype.hasOwnProperty.call(value, "data")
    ? (value.data as T)
    : (body as T);
}

const endpoints: Record<string, string> = {
  listings: "/listings",
  competitions: "/competitions",
  bookings: "/bookings",
  favorites: "/favorites",
  reviews: "/reviews",
  notifications: "/notifications",
  community_posts: "/community/posts",
  contact_messages: "/contact-messages",
  feature_requests: "/feature-requests",
  volunteer_requests: "/volunteers",
  volunteer_service_requests: "/volunteer-service-requests",
  profiles: "/profiles",
  user_roles: "/auth/user",
  user_contacts: "/profile",
  host_verifications: "/host/verification",
};

class QueryBuilder<T extends ApiTable> {
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private filters: Filter[] = [];
  private payloadValue: unknown;
  private limitValue?: number;
  private orders: Array<{ field: string; ascending: boolean }> = [];
  private wantSingle = false;
  private selected = false;

  constructor(private table: string) {}
  select(_columns = "*") {
    this.selected = true;
    return this;
  }
  insert(value: unknown, _options?: unknown) {
    this.operation = "insert";
    this.payloadValue = value;
    return this;
  }
  upsert(value: unknown, _options?: unknown) {
    this.operation = "insert";
    this.payloadValue = value;
    return this;
  }
  update(value: unknown) {
    this.operation = "update";
    this.payloadValue = value;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  eq(field: string, value: unknown) {
    this.filters.push({ field, op: "eq", value });
    return this;
  }
  neq(field: string, value: unknown) {
    this.filters.push({ field, op: "neq", value });
    return this;
  }
  in(field: string, value: unknown[]) {
    this.filters.push({ field, op: "in", value });
    return this;
  }
  gte(field: string, value: unknown) {
    this.filters.push({ field, op: "gte", value });
    return this;
  }
  lte(field: string, value: unknown) {
    this.filters.push({ field, op: "lte", value });
    return this;
  }
  not(field: string, op: string, value: unknown) {
    this.filters.push({ field, op: `not:${op}`, value });
    return this;
  }
  order(field: string, options: { ascending?: boolean } = {}) {
    this.orders.push({ field, ascending: options.ascending ?? true });
    return this;
  }
  limit(value: number) {
    this.limitValue = value;
    return this;
  }
  maybeSingle(): Promise<{ data: ApiRow<T> | null; error: ApiError | null }> {
    this.wantSingle = true;
    return this.execute(true) as Promise<{ data: ApiRow<T> | null; error: ApiError | null }>;
  }
  single(): Promise<{ data: ApiRow<T> | null; error: ApiError | null }> {
    this.wantSingle = true;
    return this.execute(true) as Promise<{ data: ApiRow<T> | null; error: ApiError | null }>;
  }
  then<TResult1 = { data: ApiRow<T>[]; error: ApiError | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: ApiRow<T>[]; error: ApiError | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return (this.execute() as Promise<{ data: ApiRow<T>[]; error: ApiError | null }>).then(
      onfulfilled,
      onrejected,
    );
  }

  private async execute(forceSingle = false): Promise<{ data: unknown; error: ApiError | null }> {
    try {
      if (
        this.table === "profiles" &&
        this.operation === "update" &&
        (this.payloadValue as Record<string, unknown>)?.account_type === "host"
      ) {
        await request("/profile/select-role", {
          method: "POST",
          body: JSON.stringify({ account_type: "host" }),
        }).catch(async (error) => {
          if ((error as { status?: number }).status === 403)
            await request("/profile/become-host", { method: "POST" });
          else throw error;
        });
      } else if (
        this.table === "profiles" &&
        this.operation === "update" &&
        (this.payloadValue as Record<string, unknown>)?.account_type === "traveler"
      ) {
        await request("/profile/select-role", {
          method: "POST",
          body: JSON.stringify({ account_type: "traveler" }),
        });
      }
      if (this.table === "user_roles" && this.operation === "select") {
        const current = payload<{
          user: ApiUser;
          profile: Record<string, unknown>;
          roles: string[];
        }>(await request("/auth/user", { method: "GET" }));
        const user = { ...current.user, profile: current.profile, roles: current.roles };
        const token = storedToken();
        if (token) storeSession({ access_token: token, token_type: "Bearer", user });
        let roles = (current.roles ?? []).map((role) => ({ role }));
        for (const filter of this.filters)
          if (filter.op === "eq")
            roles = roles.filter(
              (row) => (row as Record<string, unknown>)[filter.field] === filter.value,
            );
        const requestedUserId = this.filters.find((filter) => filter.field === "user_id")?.value;
        if (requestedUserId && requestedUserId !== user.id) roles = [];
        return {
          data: (forceSingle || this.wantSingle ? (roles[0] ?? null) : roles) as
            ApiRow<T>[] | ApiRow<T> | null,
          error: null,
        };
      }
      if (this.table === "user_contacts" && this.operation === "select") {
        const isAdmin = storedUser()?.roles?.includes("admin");
        const response = await request(
          isAdmin ? "/admin/users?per_page=100" : "/host/bookings?per_page=100",
          { method: "GET" },
        );
        const body = payload<unknown>(response) as { data?: unknown[] } | unknown[];
        let rows = Array.isArray(body) ? body : (body?.data ?? []);
        const userId = String(this.filters.find((f) => f.field === "user_id")?.value ?? "");
        rows = rows
          .filter(
            (row) =>
              !userId ||
              ((row as Record<string, unknown>).user_id ?? (row as Record<string, unknown>).id) ===
                userId,
          )
          .map((row) => ({
            user_id:
              (row as Record<string, unknown>).user_id ?? (row as Record<string, unknown>).id,
            phone:
              (row as Record<string, unknown>).guest_phone ??
              (row as Record<string, unknown>).phone,
          }));
        return {
          data: (forceSingle || this.wantSingle ? (rows[0] ?? null) : rows) as
            ApiRow<T>[] | ApiRow<T> | null,
          error: null,
        };
      }
      const { url, method, body } = this.buildRequest();
      if (!url) return { data: [], error: null };
      let result = await request(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      let data: unknown = payload<unknown>(result);
      // Laravel paginators expose page metadata. Load the remaining pages for
      // legacy screens that paginate the resulting collection locally.
      const response = isRecord(result) ? result : {};
      const pageData = isRecord(data) ? data : {};
      const firstPageRows = Array.isArray(data)
        ? data
        : Array.isArray(pageData.data)
          ? pageData.data
          : [];
      const responseMeta = isRecord(response.meta) ? response.meta : {};
      const pageMeta = isRecord(pageData.meta) ? pageData.meta : {};
      const lastPage = Number(
        responseMeta.last_page ?? pageMeta.last_page ?? pageData.last_page ?? 1,
      );
      if (this.operation === "select" && firstPageRows.length > 0 && lastPage > 1) {
        const allRows: unknown[] = [...firstPageRows];
        for (let page = 2; page <= lastPage; page++) {
          const pageUrl = /([?&])page=\d+/.test(url)
            ? url.replace(/([?&])page=\d+/, `$1page=${page}`)
            : `${url}${url.includes("?") ? "&" : "?"}page=${page}`;
          result = await request(pageUrl, { method: "GET" });
          const nextPayload = payload<unknown>(result);
          const nextPage = isRecord(nextPayload) ? nextPayload : {};
          if (Array.isArray(nextPage.data)) allRows.push(...nextPage.data);
          else if (Array.isArray(nextPayload)) allRows.push(...nextPayload);
        }
        data = allRows;
      }
      if (
        data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray((data as { data: unknown }).data)
      )
        data = (data as { data: unknown[] }).data;
      if (!Array.isArray(data) && data != null && this.operation === "select") data = [data];
      if (Array.isArray(data)) {
        let rows = data.filter(isRecord);
        for (const filter of this.filters) {
          if (filter.op === "in" && Array.isArray(filter.value))
            rows = rows.filter((row) => (filter.value as unknown[]).includes(row[filter.field]));
          if (filter.op === "neq") rows = rows.filter((row) => row[filter.field] !== filter.value);
          if (filter.op === "gte")
            rows = rows.filter((row) => Number(row[filter.field]) >= Number(filter.value));
          if (filter.op === "lte")
            rows = rows.filter((row) => Number(row[filter.field]) <= Number(filter.value));
          if (filter.op === "not:is" && filter.value === null)
            rows = rows.filter((row) => row[filter.field] !== null);
        }
        for (const order of [...this.orders].reverse())
          rows = [...rows].sort((a, b) => {
            const av = a[order.field] as string | number;
            const bv = b[order.field] as string | number;
            return (av > bv ? 1 : av < bv ? -1 : 0) * (order.ascending ? 1 : -1);
          });
        if (this.limitValue !== undefined) rows = rows.slice(0, this.limitValue);
        data = rows;
      }
      if (forceSingle || this.wantSingle) data = Array.isArray(data) ? (data[0] ?? null) : data;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : String(error),
          status: (error as { status?: number }).status,
        },
      };
    }
  }

  private buildRequest(): { url: string; method: string; body?: unknown } {
    const id = String(this.filters.find((f) => f.field === "id" && f.op === "eq")?.value ?? "");
    const userId = String(
      this.filters.find((f) => f.field === "user_id" && f.op === "eq")?.value ?? "",
    );
    const hostId = String(
      this.filters.find((f) => f.field === "host_id" && f.op === "eq")?.value ?? "",
    );
    const me = storedUser();
    let base = endpoints[this.table];
    if (!base) throw new Error(`Unsupported API resource: ${this.table}`);

    if (this.table === "profiles") {
      const ids = this.filters.find((f) => f.field === "id" && f.op === "in")?.value as
        string[] | undefined;
      if (ids) base = `/profiles?ids=${encodeURIComponent(ids.join(","))}`;
      else if (id && id === me?.id) base = "/profile";
      else if (!id && me?.roles?.includes("admin")) base = "/admin/users?per_page=100";
      else base = `/profiles?ids=${encodeURIComponent(id)}`;
    } else if (this.table === "listings") {
      if (
        this.operation === "select" &&
        this.filters.some((f) => f.field === "is_featured" && f.value === true)
      )
        base = "/listings/featured";
      else if (this.operation === "select" && id) base += `/${id}`;
      else if (this.operation === "select" && hostId && hostId === me?.id) base = "/host/listings";
      else if (this.operation === "select" && me?.roles?.includes("admin"))
        base = "/admin/listings";
    } else if (this.table === "competitions") {
      if (this.operation === "select" && id) base += `/${id}`;
      else if (this.operation === "select" && hostId && hostId === me?.id)
        base = "/host/competitions";
    } else if (this.table === "bookings" && this.operation === "select") {
      if (id) base += `/${id}`;
      else if (this.filters.some((f) => f.field === "host_id")) base = "/host/bookings";
    } else if (this.table === "reviews") {
      const listingId = String(this.filters.find((f) => f.field === "listing_id")?.value ?? "");
      if (this.operation === "select" && listingId) base = `/listings/${listingId}/reviews`;
    } else if (this.table === "feature_requests" && this.operation === "select") {
      base = hostId && hostId === me?.id ? "/host/feature-requests" : "/admin/feature-requests";
    } else if (
      this.table === "volunteer_requests" &&
      this.operation === "select" &&
      me?.roles?.includes("admin")
    )
      base = "/admin/volunteers";
    else if (
      this.table === "volunteer_requests" &&
      this.operation === "select" &&
      userId &&
      userId === me?.id
    )
      base = "/volunteers/application";

    if (this.operation === "select") {
      if (this.table === "user_roles") {
        const roles = me?.roles ?? [];
        return { url: "", method: "GET" };
      }
      if (this.table === "user_contacts" && userId && userId !== me?.id) {
        base = "/host/bookings";
      }
      const query = new URLSearchParams();
      if (this.limitValue) query.set("per_page", String(Math.min(this.limitValue, 100)));
      for (const filter of this.filters)
        if (
          filter.op === "eq" &&
          !["id", "user_id", "host_id", "listing_id"].includes(filter.field)
        )
          query.set(filter.field, String(filter.value));
      const suffix = query.toString();
      if (suffix && !base.includes("?")) base += `?${suffix}`;
      return { url: base, method: "GET" };
    }

    if (this.table === "user_roles")
      return { url: "/profile/become-host", method: "POST", body: {} };
    if (this.table === "user_contacts")
      return { url: "/profile/contact", method: "PUT", body: this.payloadValue };
    if (this.table === "profiles") {
      const profile = { ...(this.payloadValue as Record<string, unknown>) };
      if ("is_blocked" in profile && id)
        return { url: `/admin/users/${id}/block`, method: "PATCH", body: profile };
      delete profile.account_type;
      delete profile.role_selected;
      return { url: "/profile", method: "PATCH", body: profile };
    }
    if (this.table === "host_verifications")
      return { url: "/host/verification", method: "PUT", body: this.payloadValue };
    if (this.operation === "insert") {
      const body = this.payloadValue;
      if (this.table === "favorites") return { url: base, method: "PUT", body };
      if (this.table === "reviews") {
        const row = body as Record<string, unknown>;
        return { url: `/listings/${row.listing_id}/reviews`, method: "POST", body: row };
      }
      if (this.table === "feature_requests" && me?.roles?.includes("host"))
        return { url: "/feature-requests", method: "POST", body };
      return { url: base, method: "POST", body };
    }
    if (this.operation === "update") {
      if (
        this.table === "listings" &&
        "is_featured" in (this.payloadValue as Record<string, unknown>)
      )
        return { url: `/admin/listings/${id}/featured`, method: "PATCH", body: this.payloadValue };
      if (this.table === "notifications")
        return { url: "/notifications/read-all", method: "PATCH", body: {} };
      if (this.table === "bookings")
        return { url: `${base}/${id}`, method: "PATCH", body: this.payloadValue };
      if (this.table === "listings" || this.table === "competitions")
        return { url: `${base}/${id}`, method: "PATCH", body: this.payloadValue };
      if (this.table === "reviews")
        return { url: `/reviews/${id}`, method: "PATCH", body: this.payloadValue };
      if (this.table === "feature_requests") {
        const prefix = me?.roles?.includes("admin")
          ? "/admin/feature-requests"
          : "/host/feature-requests";
        return { url: `${prefix}/${id}`, method: "PATCH", body: this.payloadValue };
      }
      if (this.table === "volunteer_requests")
        return me?.roles?.includes("admin")
          ? { url: `/admin/volunteers/${id}`, method: "PATCH", body: this.payloadValue }
          : { url: "/volunteers/applications", method: "POST", body: this.payloadValue };
      if (this.table === "volunteer_service_requests")
        return { url: `${base}/${id}`, method: "PATCH", body: this.payloadValue };
    }
    if (this.operation === "delete") {
      if (this.table === "favorites") return { url: `${base}/by-id/${id}`, method: "DELETE" };
      if (
        this.table === "bookings" ||
        this.table === "listings" ||
        this.table === "competitions" ||
        this.table === "reviews" ||
        this.table === "community_posts"
      )
        return { url: `${base}/${id}`, method: "DELETE" };
      if (this.table === "volunteer_requests")
        return { url: `/admin/volunteers/${id}`, method: "DELETE" };
    }
    throw new Error(`Unsupported ${this.operation} operation for ${this.table}`);
  }
}

const auth = {
  async currentSession() {
    const token = storedToken();
    let user = storedUser();
    if (token && user) {
      try {
        const result = (await request("/auth/user", { method: "GET" }, token)) as {
          data: { user: ApiUser; profile: Record<string, unknown>; roles: string[] };
        };
        user = { ...result.data.user, profile: result.data.profile, roles: result.data.roles };
        storeSession({ access_token: token, token_type: "Bearer", user });
      } catch (error) {
        if ((error as { status?: number }).status === 401) {
          storeSession(null);
          user = null;
        }
      }
    }
    return {
      data: {
        session:
          token && user ? { access_token: token, token_type: "Bearer" as const, user } : null,
      },
      error: null,
    };
  },
  onChange(callback: (event: string, session: ApiSession | null) => void) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
  async login({ email, password }: { email: string; password: string }) {
    try {
      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const value = result as {
        data: { user: ApiUser; profile: Record<string, unknown>; roles: string[] };
        token: string;
      };
      const user = { ...value.data.user, profile: value.data.profile, roles: value.data.roles };
      storeSession({ access_token: value.token, token_type: "Bearer", user });
      return {
        data: { user, session: { access_token: value.token, token_type: "Bearer", user } },
        error: null,
      };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as ApiError };
    }
  },
  async register({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }) {
    try {
      const meta = options?.data ?? {};
      const display = String(meta.display_name ?? "")
        .trim()
        .split(/\s+/);
      const result = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: display.shift() ?? "",
          last_name: display.join(" ") || "-",
          email,
          phone: meta.phone,
          password,
          password_confirmation: password,
          account_type: meta.account_type,
          national_id: meta.national_id,
        }),
      });
      const value = result as {
        data: { user: ApiUser; profile: Record<string, unknown>; roles: string[] };
        token: string;
      };
      const user = { ...value.data.user, profile: value.data.profile, roles: value.data.roles };
      storeSession({ access_token: value.token, token_type: "Bearer", user });
      return {
        data: { user, session: { access_token: value.token, token_type: "Bearer", user } },
        error: null,
      };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as ApiError };
    }
  },
  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* clear local credentials even if server is unavailable */
    }
    storeSession(null);
    return { error: null };
  },
  async acceptOAuthToken(token: string) {
    const response = (await request("/auth/user", { method: "GET" }, token)) as {
      data: { user: ApiUser; profile: Record<string, unknown>; roles: string[] };
    };
    const user = {
      ...response.data.user,
      profile: response.data.profile,
      roles: response.data.roles,
    };
    storeSession({ access_token: token, token_type: "Bearer", user });
    return user;
  },
};

const uploadsClient = {
  bucket(bucket: string) {
    return {
      async upload(path: string, file: File, _options?: unknown) {
        try {
          const form = new FormData();
          form.set("file", file);
          if (bucket === "identity-docs")
            form.set("side", path.split("/")[1]?.split("-")[0] ?? "front");
          const endpoint =
            bucket === "identity-docs" ? "/uploads/identity-documents" : "/uploads/listing-images";
          const result = await request(endpoint, { method: "POST", body: form });
          const data = payload<{ path: string; url?: string }>(result);
          if (data.url) uploads.set(data.path, data.url);
          return { data: { path: data.path }, error: null };
        } catch (error) {
          return { data: null, error: error as ApiError };
        }
      },
      async createSignedUrl(path: string, _expiresIn?: number) {
        const url =
          uploads.get(path) ??
          (path.startsWith("http") ? path : `${baseUrl.replace(/\/api\/v1$/, "")}/storage/${path}`);
        return { data: { signedUrl: url }, error: null };
      },
      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: path.startsWith("http")
              ? path
              : `${baseUrl.replace(/\/api\/v1$/, "")}/storage/${path}`,
          },
        };
      },
    };
  },
};

export type User = ApiUser;
export const backend = {
  resource: <T extends ApiTable>(table: T) => new QueryBuilder<T>(table),
  auth,
  uploads: uploadsClient,
};
export const apiBaseUrl = baseUrl;
