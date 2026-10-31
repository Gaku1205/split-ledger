import { colorNumber, initialOf } from "@/lib/members";

type Props = {
  name: string;
  /** メンバーに足した順（0から） */
  index: number;
  size: 24 | 28;
};

/** 人の印（名前の頭文字の丸）。名前は横に書くので読み上げない */
export function PersonMark({ name, index, size }: Props) {
  return (
    <span className={`mark mark-${size} mark-c${colorNumber(index)}`} aria-hidden="true">
      {initialOf(name)}
    </span>
  );
}
