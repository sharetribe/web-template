import React from "react";

import { MenuContent, MenuItem, MenuLabel } from "../../components";
import { renderWithProviders as render } from "../../util/testHelpers";
import Menu from "./Menu";

import "@testing-library/jest-dom";

describe("Menu", () => {
	// This is quite small component what comes to rendered HTML
	// For now, we rely on snapshot-testing.
	it("matches snapshot", () => {
		const tree = render(
			<Menu>
				<MenuLabel>Label</MenuLabel>
				<MenuContent>
					<MenuItem key="1">Menu item 1</MenuItem>
					<MenuItem key="2">Menu item 2</MenuItem>
				</MenuContent>
			</Menu>,
		);
		expect(tree.asFragment()).toMatchSnapshot();
	});
});
