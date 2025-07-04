import Head from "next/head";
import dynamic from "next/dynamic";
import { useState } from "react";
import Script from "next/script";

import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from "../../../public/static/charting_library/charting_library";
import { ExtendedWidgetOptions } from "../_utils/types";

// interface ExtendedWidgetOptions extends ChartingLibraryWidgetOptions {
//   chainId: string; // Adding chainId to the properties
// }

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  symbol: "0xe7a3D1A2e108A67b7F678297907eB477f661e8bf",
  interval: '5' as ResolutionString,
  library_path: "/static/charting_library/",
  locale: "en",
  charts_storage_url: "https://saveload.tradingview.com",
  charts_storage_api_version: "1.1",
  client_id: "tradingview.com",
  user_id: "public_user_id",
  fullscreen: false,
  autosize: true,
};

const TVChartContainer = dynamic(
  () =>
    import("./tv-chart-container").then((mod) => mod.TVChartContainer),
  { ssr: false }
);

export default function CandleChart({ tokenAddress, chainId}: { tokenAddress: string; chainId: string }) {
  const [isScriptReady, setIsScriptReady] = useState(false);

  const widgetProps = {
    ...defaultWidgetProps,
    symbol: tokenAddress,
    chainId: chainId,  // Use the token address as the symbol
  };
  
  return (
    <>
      <Head>
        <title>Sample Demo TradingView with NextJS</title>
      </Head>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
      {isScriptReady && <TVChartContainer {...widgetProps as ExtendedWidgetOptions} />}
    </>
  );
}
