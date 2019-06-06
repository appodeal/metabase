import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

export default class LogoIcon extends Component {
  static defaultProps = {
    size: 32,
  };

  static propTypes = {
    size: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    dark: PropTypes.bool,
  };

  render() {
    let { dark, height, width, size } = this.props;
    return (
      <svg
        className={cx("Icon", { "text-brand": !dark }, { "text-white": dark })}
        viewBox="0 0 240 241"
        width={width || size}
        height={height || size}
        fill="currentcolor"
      >
        <path fillRule="evenodd" clipRule="evenodd" d="M213.745 191.623C204.186 204.894 191.897 216.105 177.787 224.571C126.124 254.544 60.5796 239.443 26.2141 191.623L86.9796 156.159L119.752 137.168L213.745 191.623Z" fill="#223551"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M102.84 0.0488281V107.669L10.1266 161.366C3.37561 146.639 0.0001297 130.553 0.0001297 114.013C0.0001297 54.6519 45.2315 5.71305 102.84 0.0488281Z" fill="#FCBE46"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M235.993 84.4405C242.944 110.233 240.701 137.157 229.716 161.366L137.12 107.744V0.0488281C153.038 1.63259 168.732 6.61011 182.857 14.7551C209.313 30.1402 228.146 54.8016 235.993 84.4405Z" fill="#E84039"/>
      </svg>
    );
  }
}
