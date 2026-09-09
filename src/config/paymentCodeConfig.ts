import type { PaymentCodeConfig } from "@/types/paymentCodeConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 文章尾部收款码配置。
 *
 * 图片路径由内容仓的 `config/payment-code.yaml` 覆盖；默认关闭以避免未配置
 * 收款码图片的站点产生空 DOM 或失效图片请求。启用后组件会在构建期读取
 * 图片真实宽高并生成稳定的响应式占位。
 */
export const paymentCodeConfig: PaymentCodeConfig = withUserConfig(
	"paymentCode",
	{
		enable: false,
		images: {
			alipay: "/assets/collection/alipay.webp",
			wechat: "/assets/collection/weixin_pay.webp",
		},
	},
);
