import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 0 L20 12 L32 16 L20 20 L16 32 L12 20 L0 16 L12 12 Z"
          fill="#eab308"
        />
      </svg>
    ),
    { ...size },
  );
}
