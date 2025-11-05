interface LinePathOptions<T> {
  data: T[];
  width: number;
  getY: (point: T, index: number) => number;
}

interface AreaPathOptions<T> extends LinePathOptions<T> {
  baseY: number;
}

function getXCoordinate(index: number, length: number, width: number): number {
  if (length <= 1) {
    return width / 2;
  }

  return (index / (length - 1)) * width;
}

export function buildLinePath<T>({
  data,
  width,
  getY,
}: LinePathOptions<T>): string {
  if (data.length === 0) {
    return "";
  }

  return data
    .map((point, index) => {
      const x = getXCoordinate(index, data.length, width);
      const y = getY(point, index);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function buildAreaPath<T>({
  data,
  width,
  baseY,
  getY,
}: AreaPathOptions<T>): string {
  if (data.length === 0) {
    return "";
  }

  const segments = data
    .map((point, index) => {
      const x = getXCoordinate(index, data.length, width);
      const y = getY(point, index);
      return `L ${x} ${y}`;
    })
    .join(" ");

  return `M 0 ${baseY} ${segments} L ${width} ${baseY} Z`;
}
