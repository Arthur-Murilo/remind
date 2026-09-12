"use client";

import { useEffect, useState } from "react";
import { PHONE_MEDIA_QUERY } from "@/lib/viewport";

export function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(PHONE_MEDIA_QUERY);
    const update = () => setIsPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isPhone;
}
