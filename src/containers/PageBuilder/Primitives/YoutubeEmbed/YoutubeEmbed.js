import React from "react";
import classNames from "classnames";
import { string } from "prop-types";

import { AspectRatioWrapper } from "../../../../components/index.js";
import { lazyLoadWithDimensions } from "../../../../util/uiHelpers.js";
import css from "./YoutubeEmbed.module.css";

const RADIX = 10;
const BLACK_BG = "#000000";

const IFrame = (props) => {
	const { dimensions, title, ...rest } = props;
	return <iframe title={title} {...dimensions} {...rest} />;
};
const LazyIFrame = lazyLoadWithDimensions(IFrame);

export const YoutubeEmbed = (props) => {
	const { className, rootClassName, youtubeVideoId, aspectRatio } = props;
	const hasSlash = aspectRatio.indexOf("/") > 0;
	const [aspectWidth, aspectHeight] = hasSlash ? aspectRatio.split("/") : [16, 9];
	const width = Number.parseInt(aspectWidth, RADIX);
	const height = Number.parseInt(aspectHeight, RADIX);
	const classes = classNames(rootClassName || css.video, className);

	return (
		<AspectRatioWrapper className={classes} width={width} height={height}>
			<LazyIFrame
				src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
				className={css.iframe}
				style={{ background: BLACK_BG }}
				frameBorder="0"
				allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				title="Embedded youtube"
			/>
		</AspectRatioWrapper>
	);
};

YoutubeEmbed.displayName = "YoutubeEmbed";

YoutubeEmbed.defaultProps = {
	rootClassName: null,
	className: null,
	aspectRatio: "16/9",
};

YoutubeEmbed.propTypes = {
	rootClassName: string,
	className: string,
	youtubeVideoId: string.isRequired,
	aspectRatio: string,
};
