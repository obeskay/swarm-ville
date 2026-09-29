/**
 * The optional access code. A relay started with ACCESS_CODE asks for it on every
 * API call and on the socket; a relay without one never mentions it. The code is
 * remembered in this browser, and `?code=` in the address is how an invitation
 * carries it.
 */

const STORAGE = "swarm-ville.code.v1";

export const getCode = () => {
  try {
    return window.localStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
};

export const setCode = (code: string) => {
  try {
    if (code) window.localStorage.setItem(STORAGE, code);
    else window.localStorage.removeItem(STORAGE);
  } catch {
    // It works for this visit; it just will not be remembered.
  }
};

/** `fetch` for the relay's API: adds the code when there is one. */
export const apiFetch = (input: string, init: RequestInit = {}) => {
  const code = getCode();
  return fetch(input, code ? { ...init, headers: { ...init.headers, "x-access-code": code } } : init);
};

/** Whether the relay wants a code at all. Unreachable counts as "no": the app shows its own offline state. */
export const relayIsLocked = async () => {
  try {
    const response = await fetch("/api/health");
    const body = (await response.json()) as { locked?: boolean };
    return body.locked === true;
  } catch {
    return false;
  }
};

export const codeIsValid = async (code: string) => {
  try {
    return (await fetch(`/api/access?code=${encodeURIComponent(code)}`)).ok;
  } catch {
    return false;
  }
};
