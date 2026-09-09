import { expect, type Page, test } from "@playwright/test";

async function openFirstPost(page: Page) {
	await page.goto("/", { waitUntil: "domcontentloaded" });

	const postLink = page.locator('#swup-container a[href*="/posts/"]').first();
	await expect(postLink).toHaveCount(1);

	const href = await postLink.getAttribute("href");
	if (!href) {
		throw new Error("No article link found on the homepage");
	}

	await page.goto(href, { waitUntil: "domcontentloaded" });
}

test.describe("article payment code", () => {
	test.use({ viewport: { width: 1280, height: 900 } });

	test("renders between the article body and license, then opens on hover", async ({
		page,
	}) => {
		await openFirstPost(page);

		const payment = page.locator("[data-payment-code]");
		const popover = payment.locator(".m3-payment-code__popover");

		await expect(payment).toHaveCount(1);
		await expect(payment.locator("svg")).toBeVisible();
		await expect(payment.locator(".m3-payment-code__trigger-label")).toHaveText(
			/\S+/,
		);
		const images = payment.locator("img");
		await expect(images).toHaveCount(2);
		await expect(images.nth(0)).toHaveAttribute("src", /\S+/);
		await expect(images.nth(1)).toHaveAttribute("src", /\S+/);
		const labels = payment.locator(".m3-payment-code__qr-label");
		await expect(labels).toHaveCount(2);
		await expect(labels.nth(0)).toHaveText(/\S+/);
		await expect(labels.nth(1)).toHaveText(/\S+/);

		const domOrder = await page.evaluate(() => {
			const body = document.querySelector(
				".markdown-content, [data-protected-content]",
			);
			const paymentCode = document.querySelector("[data-payment-code]");
			const license = document.querySelector(".license-container");
			if (!body || !paymentCode || !license) {
				throw new Error("Article payment code structure is incomplete");
			}
			return {
				followsBody: Boolean(
					body.compareDocumentPosition(paymentCode) &
						Node.DOCUMENT_POSITION_FOLLOWING,
				),
				precedesLicense: Boolean(
					paymentCode.compareDocumentPosition(license) &
						Node.DOCUMENT_POSITION_FOLLOWING,
				),
			};
		});
		expect(domOrder).toEqual({ followsBody: true, precedesLicense: true });

		await expect(popover).toBeHidden();
		await payment.hover();
		await expect(popover).toBeVisible();
		const desktopBox = await popover.boundingBox();
		if (!desktopBox) throw new Error("Payment code popover has no layout box");
		expect(desktopBox.width).toBeLessThanOrEqual(384);

		const qrBoxes = await payment
			.locator(".m3-payment-code__qr")
			.evaluateAll((elements) =>
				elements.map((element) => {
					const rect = element.getBoundingClientRect();
					return { x: rect.x, width: rect.width, height: rect.height };
				}),
			);
		expect(qrBoxes[0].x).toBeLessThan(qrBoxes[1].x);
		expect(qrBoxes[0].height).toBeGreaterThan(qrBoxes[0].width);
		expect(qrBoxes[1].height).toBeGreaterThan(qrBoxes[1].width);
		const imageMetrics = await payment
			.locator(".m3-payment-code__image")
			.evaluateAll((elements) =>
				elements.map((element) => {
					const image = element.querySelector("img");
					const rect = element.getBoundingClientRect();
					return {
						width: Number(image?.getAttribute("width")),
						height: Number(image?.getAttribute("height")),
						ratio: rect.width / rect.height,
					};
				}),
			);
		const widestSourceRatio = Math.max(
			...imageMetrics.map(({ width, height }) => width / height),
		);
		for (const metric of imageMetrics) {
			expect(metric.width).toBeGreaterThan(0);
			expect(metric.height).toBeGreaterThan(0);
			expect(metric.ratio).toBeCloseTo(widestSourceRatio, 2);
		}

		await popover.hover();
		await expect(popover).toBeVisible();

		await page.mouse.move(8, 8);
		await expect(popover).toBeHidden();
	});

	test("opens for keyboard focus without a click", async ({ page }) => {
		await openFirstPost(page);

		const payment = page.locator("[data-payment-code]");
		const popover = payment.locator(".m3-payment-code__popover");
		await payment.locator("button").focus();

		await expect(popover).toBeVisible();
		await expect(payment.locator("button")).toHaveAttribute(
			"aria-label",
			/Support the author|支持作者/,
		);
	});

	test("scales within a narrow viewport", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await openFirstPost(page);

		const payment = page.locator("[data-payment-code]");
		const popover = payment.locator(".m3-payment-code__popover");
		await payment.hover();
		await expect(popover).toBeVisible();

		const mobileBox = await popover.boundingBox();
		if (!mobileBox) throw new Error("Payment code popover has no layout box");
		expect(mobileBox.width).toBeLessThanOrEqual(358);
		expect(mobileBox.x).toBeGreaterThanOrEqual(0);
		expect(mobileBox.x + mobileBox.width).toBeLessThanOrEqual(390);
	});
});
