import { useRouter } from "next/router";
import { DefaultSeo } from "next-seo";
import { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SEO from "../next-seo.config";
import "../styles/index.css";
import { NextUIProvider } from "@nextui-org/system";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <>
      <DefaultSeo {...SEO} />
      <NextUIProvider navigate={router.push}>
        <Component {...pageProps} />
      </NextUIProvider>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
