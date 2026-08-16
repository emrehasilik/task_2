import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#1d5a3a",
          borderRadius: 18,
          color: "#fffdf8",
          display: "flex",
          fontFamily: "serif",
          fontSize: 42,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        L
      </div>
    ),
    size,
  );
}
