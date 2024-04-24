// import styles from "./index.module.css";
import { useEffect, useRef } from "react";
import { ChartingLibraryWidgetOptions, LanguageCode, ResolutionString, widget } from "../../../public/static/charting_library";
import React from "react";
import CustomDatafeed from "../_utils/custom-data-feed";

const TVChartContainerBase = (props: Partial<ChartingLibraryWidgetOptions>) => {
	const chartContainerRef =
		useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

	useEffect(() => {
		const widgetOptions: ChartingLibraryWidgetOptions = {
			symbol: props.symbol,
			datafeed: new CustomDatafeed(),
			interval: props.interval as ResolutionString,
			container: chartContainerRef.current,
			library_path: props.library_path,
			locale: props.locale as LanguageCode,
			disabled_features: ["use_localstorage_for_settings"],
			enabled_features: [],
			charts_storage_url: props.charts_storage_url,
			charts_storage_api_version: props.charts_storage_api_version,
			client_id: props.client_id,
			user_id: props.user_id,
			fullscreen: props.fullscreen,
			autosize: props.autosize,
			theme: 'dark',
		};

		const tvWidget = new widget(widgetOptions);

		tvWidget.onChartReady(() => {
			tvWidget.headerReady().then(() => {;
				const button = tvWidget.createButton();
				button.setAttribute("title", "Click to show a notification popup");
				button.classList.add("apply-common-tooltip");
				// button.addEventListener("click", () =>
				// 	tvWidget.showNoticeDialog({
				// 		title: "Notification",
				// 		body: "TradingView Charting Library API works correctly",
				// 		callback: () => {
				// 			console.log("Noticed!");
				// 		},
				// 	})
				// );
				// button.innerHTML = "Check API";
			});
		});

		return () => {
			tvWidget.remove();
		};
	}, [props]);

	return (
		<>
			<div id="tv-chart-zke2bqah0fs" className="h-400 w-[99%]" ref={chartContainerRef}/>
		</>
	);
};

export const TVChartContainer = React.memo(TVChartContainerBase, (prevProps, nextProps) => {
	// Implement a comparison function if necessary
	return prevProps.symbol === nextProps.symbol && prevProps.interval === nextProps.interval;
  });