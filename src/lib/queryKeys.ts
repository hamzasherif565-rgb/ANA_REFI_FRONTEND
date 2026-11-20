// Central query key factory. Use prefix-based invalidation:
//   queryClient.invalidateQueries({ queryKey: qk.listings.all })
// invalidates every ["listings", ...] entry.
export const qk = {
  listings: {
    all: ["listings"] as const,
    byType: (type: string) => ["listings", "type", type] as const,
    byId: (id: string) => ["listings", "id", id] as const,
    byHost: (uid: string) => ["listings", "host", uid] as const,
    byIds: (ids: string[]) => ["listings", "ids", [...ids].sort().join(",")] as const,
    ids: (status: string) => ["listings", "ids-order", status] as const,
    featured: ["listings", "featured"] as const,
  },
  competitions: {
    all: ["competitions"] as const,
    list: ["competitions", "list"] as const,
    byIds: (ids: string[]) => ["competitions", "ids", [...ids].sort().join(",")] as const,
  },
  volunteers: {
    all: ["volunteer_requests"] as const,
    byUser: (uid: string) => ["volunteer_requests", "user", uid] as const,
    approved: ["volunteer_requests", "approved"] as const,
  },
  volunteerServiceRequests: {
    all: ["volunteer_service_requests"] as const,
    byRequester: (uid: string) => ["volunteer_service_requests", "requester", uid] as const,
    byVolunteer: (uid: string) => ["volunteer_service_requests", "volunteer", uid] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    byListing: (id: string) => ["reviews", "listing", id] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    byUser: (uid: string) => ["bookings", "user", uid] as const,
    byHost: (uid: string) => ["bookings", "host", uid] as const,
    countByHost: (uid: string) => ["bookings", "host-count", uid] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    byUser: (uid: string) => ["notifications", "user", uid] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    byUser: (uid: string) => ["favorites", "user", uid] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    byId: (id: string) => ["profiles", "id", id] as const,
    byIds: (ids: string[]) => ["profiles", "ids", [...ids].sort().join(",")] as const,
  },
  userRoles: {
    all: ["user_roles"] as const,
    byUser: (uid: string) => ["user_roles", "user", uid] as const,
  },
  userContacts: {
    all: ["user_contacts"] as const,
    byUser: (uid: string) => ["user_contacts", "user", uid] as const,
  },
  community: {
    posts: ["community_posts"] as const,
  },
  featureRequests: {
    all: ["feature_requests"] as const,
    byHost: (uid: string) => ["feature_requests", "host", uid] as const,
  },
};