/**
 * 文章尾部收款码配置。
 *
 * 图片路径支持两种本地资源写法：
 * - 以 `/` 开头：相对于项目 `public/` 目录；
 * - 不以 `/` 开头：相对于主题 `src/` 目录（例如 `assets/images/foo.webp`）。
 *
 * 收款码图片需要是本地资源，主题会在构建期读取真实宽高，避免组件维护
 * 与图片文件脱节的尺寸常量。
 */
export interface PaymentCodeConfig {
	/** 是否在文章正文与许可协议之间显示收款码。 */
	enable: boolean;
	/** 横向排列的收款码图片。 */
	images: {
		/** 支付宝收款码图片路径。 */
		alipay: string;
		/** 微信支付收款码图片路径。 */
		wechat: string;
	};
}
