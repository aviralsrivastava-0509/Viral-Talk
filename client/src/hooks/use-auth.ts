import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

export type UsernameStatus = "new" | "existing" | "needs-password";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `${res.status}: ${res.statusText}`);
  return data as T;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const checkUsernameMutation = useMutation({
    mutationFn: (username: string) =>
      postJson<{ status: UsernameStatus; username: string }>("/api/auth/check-username", { username }),
  });

  const loginMutation = useMutation({
    mutationFn: (vars: { username: string; password: string; mode: UsernameStatus }) =>
      postJson<User>("/api/auth/login", vars),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: (vars: { newPassword: string; currentPassword?: string }) =>
      postJson<{ ok: true }>("/api/auth/set-password", vars),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,

    checkUsername: checkUsernameMutation.mutateAsync,
    isCheckingUsername: checkUsernameMutation.isPending,
    checkUsernameError: checkUsernameMutation.error as Error | null,

    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error as Error | null,
    resetLoginError: () => loginMutation.reset(),

    setPassword: setPasswordMutation.mutateAsync,
    isSettingPassword: setPasswordMutation.isPending,
    setPasswordError: setPasswordMutation.error as Error | null,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
