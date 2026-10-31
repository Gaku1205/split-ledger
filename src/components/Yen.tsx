import { formatNumber } from "@/lib/format";

/** 金額（数字＋1段小さい「円」） */
export function Yen({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className ? `yen ${className}` : "yen"}>
      {formatNumber(value)}
      <span className="yen-unit">円</span>
    </span>
  );
}
