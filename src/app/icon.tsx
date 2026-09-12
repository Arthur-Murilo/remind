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
          background: "linear-gradient(90deg, #00d2ff 0%, #007cff 100%)",
          borderRadius: "50%"
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 7.2c-3.1 0-5.2 2.1-5.2 5.4v4.1l-1.7 2.4c-.4.5-.1 1.3.5 1.3h13c.6 0 1-.8.5-1.3l-1.7-2.4v-4.1c0-3.3-2.1-5.4-5.4-5.4Z"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M13.6 21.6a2.4 2.4 0 0 0 4.8 0"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M22.2 20.2v4.4M20 22.4h4.4"
            stroke="#ffffff"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
