export const cookieValues = new Map<string, string>();

export async function cookies() {
  return {
    get(name: string) {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { value };
    },
    set(name: string, value: string) {
      cookieValues.set(name, value);
    },
    delete(name: string) {
      cookieValues.delete(name);
    },
  };
}

export async function headers() {
  return new Headers();
}
