import { initials } from '@holomedia/shared';

export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="avatar"
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
    >
      {initials(name)}
    </div>
  );
}
