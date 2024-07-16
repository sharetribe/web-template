import React from "react";

import { renderWithProviders as render, testingLibrary } from "../../util/testHelpers";
import { TermsOfServicePageComponent } from "./TermsOfServicePage";

import "@testing-library/jest-dom";

const { waitFor } = testingLibrary;

describe("TermsOfServicePage", () => {
	it("renders the Fallback page on error", async () => {
		const errorMessage = "TermsOfServicePage failed";
		let e = new Error(errorMessage);
		e.type = "error";
		e.name = "Test";

		const { getByText } = render(
			<TermsOfServicePageComponent pageAssetsData={null} inProgress={false} error={e} />,
		);

		await waitFor(() => {
			expect(getByText("Terms of Service")).toBeInTheDocument();
			expect(getByText("An error occurred")).toBeInTheDocument();
		});
	});
});
