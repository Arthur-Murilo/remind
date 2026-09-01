import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#006eee",
          borderRadius: 9
        }}
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <path
            d="M9.4 4.6h8.7c.9 0 1.7.5 2.1 1.3l5.3 10.2c.5 1-.2 2.2-1.3 2.2h-5.6v7.4c0 .9-1.1 1.4-1.8.8l-4.4-3.6H9.4c-1.5 0-2.8-1.2-2.8-2.8V7.4c0-1.5 1.3-2.8 2.8-2.8Z"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M11.3 13.1 13.9 15.6 19.4 9.8"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
