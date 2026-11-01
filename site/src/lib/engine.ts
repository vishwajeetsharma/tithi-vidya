/** Calls the tithi engine: the Rust library compiled to WebAssembly (see /wasm). */

export type Birth = {
  moment: string;
  tithi: string;
  number: number;
  paksha: string;
  elongation: number;
  begins: string;
  ends: string;
  month: string;
  purnimanta_month: string;
  adhika: boolean;
  panchang_date: string;
  sunrise: string;
  udaya_tithi: string;
  before_sunrise: boolean;
};

export type TithiDate = {
  date: string;
  label: string;
  year: number;
  month: string;
  begins: string;
  ends: string;
  kind: "normal" | "kshaya" | "vriddhi";
  also: string | null;
};

export type BirthResult = {
  place: { name: string; lat: number; lon: number; tz: string };
  birth: Birth;
  yearly: boolean;
  from: number;
  to: number;
  notes: string[];
  dates: TithiDate[];
};

export type BirthQuery = {
  date: string;
  time: string;
  place?: string;
  lat?: number;
  lon?: number;
  tz?: string;
  yearly: boolean;
};

type Call = (ptr: number, len: number) => number;
type Exports = {
  memory: WebAssembly.Memory;
  tithi_alloc(len: number): number;
  tithi_free(ptr: number, len: number): void;
  tithi_birth: Call;
};

let engine: Promise<Exports> | null = null;

function load(): Promise<Exports> {
  engine ??= (async () => {
    const url = new URL("../engine/tithi.wasm", import.meta.url);
    const response = fetch(url);
    let instance: WebAssembly.Instance;
    try {
      ({ instance } = await WebAssembly.instantiateStreaming(response));
    } catch {
      // Some servers send the wrong content type for streaming.
      ({ instance } = await WebAssembly.instantiate(await (await response).clone().arrayBuffer()));
    }
    return instance.exports as unknown as Exports;
  })().catch((error) => {
    engine = null;
    throw error;
  });
  return engine;
}

function call<T>(ex: Exports, fn: Call, input: object): T {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const ptr = ex.tithi_alloc(bytes.length);
  new Uint8Array(ex.memory.buffer, ptr, bytes.length).set(bytes);
  const out = fn(ptr, bytes.length);
  ex.tithi_free(ptr, bytes.length);
  const length = new DataView(ex.memory.buffer).getUint32(out, true);
  const text = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, out + 4, length));
  ex.tithi_free(out, length + 4);
  const value = JSON.parse(text);
  if (value.error) throw new Error(value.error);
  return value as T;
}

export async function findBirth(query: BirthQuery): Promise<BirthResult> {
  const ex = await load();
  return call(ex, ex.tithi_birth, query);
}
