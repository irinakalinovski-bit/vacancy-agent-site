export function useAuth() {
  return {
    user: { id: 1, name: "Site owner", role: "admin" },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: async () => ({ data: true }),
    logout: async () => undefined,
  };
}
