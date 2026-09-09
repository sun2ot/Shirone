import fs from "node:fs/promises";
import path from "node:path";
import { resolveImageAsset } from "@utils/asset-utils";
import { url } from "@utils/url-utils";
import sharp from "sharp";

export interface ResolvedImageMetadata {
	src: string;
	width: number;
	height: number;
}

function getPublicImagePath(src: string): string | undefined {
	if (!src.startsWith("/")) return undefined;

	const rawPath = src.split(/[?#]/, 1)[0];
	let relativePath: string;
	try {
		relativePath = decodeURIComponent(rawPath.slice(1));
	} catch {
		return undefined;
	}

	const publicRoot = path.resolve(process.cwd(), "public");
	const candidate = path.resolve(publicRoot, relativePath);
	const relative = path.relative(publicRoot, candidate);
	if (
		relative === "" ||
		relative.startsWith("..") ||
		path.isAbsolute(relative)
	) {
		return undefined;
	}

	return candidate;
}

const publicMetadataCache = new Map<
	string,
	Promise<{ width: number; height: number } | undefined>
>();

async function readPublicImageMetadata(
	src: string,
): Promise<{ width: number; height: number } | undefined> {
	const filePath = getPublicImagePath(src);
	if (!filePath) return undefined;

	let pending = publicMetadataCache.get(filePath);
	if (!pending) {
		pending = (async () => {
			try {
				await fs.access(filePath);
				const metadata = await sharp(filePath).metadata();
				return metadata.width && metadata.height
					? { width: metadata.width, height: metadata.height }
					: undefined;
			} catch {
				return undefined;
			}
		})();
		publicMetadataCache.set(filePath, pending);
	}

	return pending;
}

/**
 * 解析本地图片 URL 及其真实宽高。
 *
 * `src/assets` 中的资源由 Astro 提供 ImageMetadata；`public/` 中的稳定公开
 * URL 则由 sharp 在构建期读取元数据。远程 URL 不在支持范围内，因为不能为
 * 收款码布局引入构建期网络请求。
 */
export async function resolveImageWithMetadata(
	src: string,
	basePath = "",
): Promise<ResolvedImageMetadata> {
	const resolved = await resolveImageAsset(src, basePath);
	if (typeof resolved !== "string") {
		return {
			src: resolved.src,
			width: resolved.width,
			height: resolved.height,
		};
	}

	const dimensions = await readPublicImageMetadata(src);
	if (dimensions) {
		return { src: url(src), ...dimensions };
	}

	throw new Error(
		`[payment-code] Unable to read local image dimensions for "${src}". ` +
			"Use an existing local image under src/assets or public.",
	);
}
