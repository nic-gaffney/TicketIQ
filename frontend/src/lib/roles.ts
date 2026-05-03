/** Logged-in API user is `end_user`; legacy mocks may use `user`. */
export function isEndUser(role: string | undefined): boolean {
  return role === "end_user" || role === "user";
}

/** API technicians are `it_support`; legacy mocks use `technician`. */
export function isItSupport(role: string | undefined): boolean {
  return role === "it_support" || role === "technician";
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}
