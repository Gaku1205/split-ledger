/**
 * 1件の立て替えを、誰の分の人で均等に分ける。
 * 1人分は切り捨て、あまりの円はメンバーに足した順に1円ずつ足す。
 * 戻り値の合計は必ず amount と一致する。
 *
 * @param memberOrder メンバーに足した順のid
 */
export function splitAmount(
  amount: number,
  sharedBy: readonly string[],
  memberOrder: readonly string[],
): Map<string, number> {
  const result = new Map<string, number>();
  const unique = Array.from(new Set(sharedBy));
  if (unique.length === 0) return result;
  const rank = (id: string) => {
    const i = memberOrder.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const ordered = unique.sort((a, b) => rank(a) - rank(b));
  const base = Math.floor(amount / ordered.length);
  let rest = amount - base * ordered.length;
  for (const id of ordered) {
    result.set(id, base + (rest > 0 ? 1 : 0));
    if (rest > 0) rest -= 1;
  }
  return result;
}

/** 「1人あたり」に出す、切り捨てた1人分と、端数があるか */
export function perPerson(amount: number, people: number): { base: number; hasRemainder: boolean } {
  const base = Math.floor(amount / people);
  return { base, hasRemainder: base * people !== amount };
}
