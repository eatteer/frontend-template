// The client throws on every failed response, so by the time a result reaches here it carries data.
// The guard is there for the compiler, which cannot know that.
export const MISSING_DATA_MESSAGE = "A successful response arrived without a body";

export function unwrap<T>({ data }: { data?: { data: T } }): T {
  if (data === undefined) {
    throw new Error(MISSING_DATA_MESSAGE);
  }

  return data.data;
}
