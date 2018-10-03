/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

import React from "react";
import { Table, Thead, Th } from "reactable";
import { Tr, Td } from "reactable";

import dateEnabledIcon from "./images/date-enabled-icon.svg";
import integerEnabledIcon from "./images/integer-enabled-icon.svg";
import doubleEnabledIcon from "./images/double-enabled-icon.svg";
import stringEnabledIcon from "./images/string-enabled-icon.svg";
import timeEnabledIcon from "./images/time-enabled-icon.svg";
import timestampEnabledIcon from "./images/timestamp-enabled-icon.svg";

import dateDisabledIcon from "./images/date-disabled-icon.svg";
import integerDisabledIcon from "./images/integer-disabled-icon.svg";
import doubleDisabledIcon from "./images/double-disabled-icon.svg";
import stringDisabledIcon from "./images/string-disabled-icon.svg";
import timeDisabledIcon from "./images/time-disabled-icon.svg";
import timestampDisabledIcon from "./images/timestamp-disabled-icon.svg";

// import inputDatasets from "./json/datasets-2.json";
// import inputDatasets from "./json/datasets-3.json";


class CustomDatasetsPanel {
	static id() {
		return "harness-custom-table-panel";
	}

	static controlName() {
		return "harness-append-datasets-summary";
	}

	static calculateColumnWidths(columns, elementId, parentTableWidth) {
		// get the parent table width
		let tableWidth = parentTableWidth;
		if (elementId !== null) {
			const table = document.getElementById(elementId);
			if (table) {
				tableWidth = parseInt(window.getComputedStyle(table, null).getPropertyValue("width"), 10);
			}
		}
		for (const columnDef of columns) {
			// if columns have specific width subtract from total width
			if (columnDef.width && typeof columnDef.width === "string" && columnDef.width.includes("px")) {
				tableWidth -= parseInt(10, columnDef.width);
			}
		}
		const widths = [];
		let totalWidth = 0;
		// only calculate column widths that don't have "px"
		for (const columnDef of columns) {
			if (!columnDef.width) {
				totalWidth += 30; // set default width of 30 if nothing provided
			} else if (typeof columnDef.width !== "string") {
				totalWidth += columnDef.width;
			}
		}
		const pxMultiplier = Math.floor(tableWidth / totalWidth);
		for (const columnDef of columns) {
			// push actual size with "px" already set
			if (columnDef.width && typeof columnDef.width === "string" && columnDef.width.includes("px")) {
				widths.push(columnDef.width);
			} else {
				const size = columnDef.width ? columnDef.width : 30;
				widths.push(size * pxMultiplier + "px");
			}
		}
		return widths;
	}

	constructor(parameters, controller, data) {
		this.parameters = parameters;
		this.controller = controller;
		this.data = data;
		this.tableWidth = "625px";
		this.inputDatasets = controller.getDatasetMetadata();
		this.dateEnabledIcon = dateEnabledIcon;
		this.integerEnabledIcon = integerEnabledIcon;
		this.doubleEnabledIcon = doubleEnabledIcon;
		this.stringEnabledIcon = stringEnabledIcon;
		this.timeEnabledIcon = timeEnabledIcon;
		this.timestampEnabledIcon = timestampEnabledIcon;

		this.dateDisabledIcon = dateDisabledIcon;
		this.integerDisabledIcon = integerDisabledIcon;
		this.doubleDisabledIcon = doubleDisabledIcon;
		this.stringDisabledIcon = stringDisabledIcon;
		this.timeDisabledIcon = timeDisabledIcon;
		this.timestampDisabledIcon = timestampDisabledIcon;

		this.getRowData = this.getRowData.bind(this);
		this.getColumnHeader = this.getColumnHeader.bind(this);
		this.getRowClassName = this.getRowClassName.bind(this);
		this.loadDatasets = this.loadDatasets.bind(this);
		this.getDatasets = this.getDatasets.bind(this);
		this.makeRecord = this.makeRecord.bind(this);
		this.checkFields = this.checkFields.bind(this);
	}

	/**
	 * Responds to table row click events.
	 *
	 * @param evt The event internally generated by a user click gesture
	 * @param rowIndex Zero-based index of the row that was clicked
	 * @param selection An array of zero-based selection indices
	 * @param allowedSelection A string containing either 'single' or 'multiple',
	 *  indicating the type of allowable selection
	 * @return A mutated copy of the selection array, modified based upon the
	 *  row clicked and any modifier keys that were down when the event was generated
	 */
	handleTableRowClick(evt, rowIndex, selection, allowedSelection) {
		var selected = selection;
		const index = selected.indexOf(rowIndex);

		if (allowedSelection === "single") {
			selected = [rowIndex];
		} else if (evt.metaKey === true || evt.ctrlKey === true) {
			// If already selected then remove otherwise add
			if (index >= 0) {
				selected.splice(index, 1);
			} else {
				selected = selected.concat(rowIndex);
			}
		} else if (evt.shiftKey === true) {
			const anchor = selected.length > 0 ? selected[0] : rowIndex;
			const start = anchor > rowIndex ? rowIndex : anchor;
			const end = (anchor > rowIndex ? anchor : rowIndex) + 1;
			const newSelns = [];
			for (let ii = start; ii < end; ii++) {
				newSelns.push(ii);
			}
			selected = newSelns;
		} else {
			selected = [rowIndex];
		}
		return selected;
	}

	handleRowClick(rowIndex, evt) {
		const selectedRows = this.controller.getSelectedRows(CustomDatasetsPanel.controlName());
		const selection = this.handleTableRowClick(evt, rowIndex, selectedRows, "multiple");
		this.controller.updateSelectedRows(CustomDatasetsPanel.controlName(), selection);
	}

	loadDatasets() {
		// Make a record for each field in the main dataset
		// The main dataset is always the first one
		CustomDatasetsPanel.datasetsMain = [];
		CustomDatasetsPanel.datasetsAll = [];
		if (!this.inputDatasets || this.inputDatasets.length === 0) {
			return;
		}
		const outputName = "OUTPUT FIELD";
		const mainName = this.inputDatasets[0].name ? this.inputDatasets[0].name : "(main)";
		CustomDatasetsPanel.datasetsMain.push({ header: outputName, data: [] });
		CustomDatasetsPanel.datasetsMain.push({ header: mainName, data: [] });
		for (let idx = 1; idx < this.inputDatasets.length; idx++) {
			const name = this.inputDatasets[idx].name ? this.inputDatasets[idx].name : "(" + (idx + 1) + ")";
			CustomDatasetsPanel.datasetsMain.push({ header: name, data: [] });
		}

		// Iterate the array of name and field objects in the first dataset (the primary),
		// making a record for each field
		for (let idx = 0; idx < this.inputDatasets[0].fields.length; idx++) {
			const fieldName = this.inputDatasets[0].fields[idx].name;
			const fieldType = this.inputDatasets[0].fields[idx].type;
			this.makeRecord(fieldName, fieldType);
		}

		// Clone the results to the "all" datasets collection
		CustomDatasetsPanel.datasetsAll = JSON.parse(JSON.stringify(CustomDatasetsPanel.datasetsMain));

		// Go through each subsequent dataset, adding records for any additional fields
		for (let idx = 1; idx < this.inputDatasets.length; idx++) {
			this.checkFields(idx);
		}
	}

	checkFields(index) {
		const inputDS = this.inputDatasets[index];
		for (let idx = 0; idx < inputDS.fields.length; idx++) {
			const fieldName = inputDS.fields[idx].name;
			let breakout = false;
			for (let idx2 = 0; idx2 < index; idx2++) {
				if (this.getField(fieldName, this.inputDatasets[idx2].fields) !== null) {
					// Already present in a previous dataset
					breakout = true;
					break;
				}
			}
			if (breakout) {
				continue;
			}

			// Back fill
			const emptyObj = { name: "", type: "" };
			CustomDatasetsPanel.datasetsMain[0].data.push(emptyObj);
			CustomDatasetsPanel.datasetsAll[0].data.push({ name: fieldName, type: inputDS.fields[idx].type });
			for (let idx2 = 0; idx2 < index; idx2++) {
				CustomDatasetsPanel.datasetsMain[idx2 + 1].data.push(emptyObj);
				CustomDatasetsPanel.datasetsAll[idx2 + 1].data.push(emptyObj);
			}
			// Front fill
			for (let idx2 = index; idx2 < this.inputDatasets.length; idx2++) {
				const field = this.getField(fieldName, this.inputDatasets[idx2].fields);
				if (field !== null) {
					CustomDatasetsPanel.datasetsMain[idx2 + 1].data
						.push({ name: fieldName, type: field.type, disabled: true });
					CustomDatasetsPanel.datasetsAll[idx2 + 1].data
						.push({ name: fieldName, type: field.type });
				} else {
					CustomDatasetsPanel.datasetsMain[idx2 + 1].data.push(emptyObj);
					CustomDatasetsPanel.datasetsAll[idx2 + 1].data.push(emptyObj);
				}
			}
		}
	}

	makeRecord(fieldName, fieldType) {
		// Add an entry for the output and the main datasets
		CustomDatasetsPanel.datasetsMain[0].data.push({ name: fieldName, type: fieldType });
		CustomDatasetsPanel.datasetsMain[1].data.push({ name: fieldName, type: fieldType });

		// Check each dependent dataset for the presence of the field
		for (let idx = 1; idx < this.inputDatasets.length; idx++) {
			const field = this.getField(fieldName, this.inputDatasets[idx].fields);
			if (field !== null) {
				CustomDatasetsPanel.datasetsMain[idx + 1].data.push({ name: fieldName, type: field.type });
			} else {
				CustomDatasetsPanel.datasetsMain[idx + 1].data.push({ name: "", type: "" });
			}
		}
	}

	getField(fieldName, fields) {
		for (let idx = 0; idx < fields.length; idx++) {
			if (fieldName === fields[idx].name) {
				return fields[idx];
			}
		}
		return null;
	}

	getDatasets() {
		if (!CustomDatasetsPanel.datasetsMain || !CustomDatasetsPanel.datasetsAll) {
			this.loadDatasets();
		}
		const propertyId = { name: "include_from" };
		const value = this.controller.getPropertyValue(propertyId);
		if (value && value === "all") {
			return CustomDatasetsPanel.datasetsAll;
		}
		return CustomDatasetsPanel.datasetsMain;
	}

	getRowData(columnWidths) {
		const rows = [];
		const datasets = this.getDatasets();
		let maxIndex = 0;
		for (let index = 0; index < datasets.length; index++) {
			maxIndex = Math.max(maxIndex, datasets[index].data.length);
		}
		for (let idx = 0; idx < maxIndex; idx++) {
			const row = [];
			for (let index = 0; index < datasets.length; index++) {
				if (idx < datasets[index].data.length) {
					const disabled = datasets[index].data[idx].disabled;
					const cellDisabledClassName = disabled ? "disabled" : "";
					const columnStyle = { "width": columnWidths[index] };
					if (index === 0) {
						columnStyle.paddingLeft = "15px";
					}
					const field = datasets[index].data[idx];
					const icon = disabled ? this[field.type + "DisabledIcon"] : this[field.type + "EnabledIcon"];
					row.push(<Td key={row.length} column={datasets[index].header} style={columnStyle}
						className={"datasets-table-cell " + cellDisabledClassName}
					>
						<div>
							<div className={"datasets-columns-type-icon datasets-columns-" +
								field.type + "-type-icon"}
							>
								<img src={icon} />
							</div>
							{datasets[index].data[idx].name}
						</div></Td>);
				} else {
					row.push(<Td key={row.length} column={datasets[index].header}
						className={"datasets-table-cell"} data={" "}
					/>);
				}
			}
			// add extra 7px cell for overlay scrollbar
			row.push(<Td key={row.length} column={"scrollbar"}
				style={{ "width": "7px", "padding": "0 0 0 0" }}
			><div /></Td>);
			rows.push(<Tr key={idx} className={this.getRowClassName(idx)}
				onClick={this.handleRowClick.bind(this, idx)}
			>
				{row}
			</Tr>);
		}

		// Add a last row for the tag name if tag_records is checked
		const propertyId = { name: "tag_records" };
		const isChecked = this.controller.getPropertyValue(propertyId);
		if (isChecked) {
			propertyId.name = "tag_field_name";
			const fieldName = this.controller.getPropertyValue(propertyId);
			const icon = this.stringEnabledIcon;
			const lastRow = [];
			const columnStyle = { "width": columnWidths[0], "paddingLeft": "15px" };
			lastRow.push(<Td key={0} column={datasets[0].header} style={columnStyle}
				className={"datasets-table-cell"}
			>
				<div>
					<div className={"datasets-columns-type-icon datasets-columns-string-type-icon"}>
						<img src={icon} />
					</div>
					{fieldName}
				</div></Td>);
			rows.push(<Tr key={rows.length} className={this.getRowClassName(rows.length)}
				onClick={this.handleRowClick.bind(this, rows.length)}
			>
				{lastRow}
			</Tr>);
		}
		return rows;
	}

	getRowClassName(rowIndex) {
		return this.controller.getSelectedRows(CustomDatasetsPanel.controlName()).indexOf(rowIndex) >= 0
			? "datasets-table-row datasets-table-selected-row "
			: "datasets-table-row";
	}

	getColumnHeader(columnWidths) {
		const headRow = [];
		const sortable = true;
		const datasets = this.getDatasets();
		for (let index = 0; index < datasets.length; index++) {
			const columnStyle = { "width": columnWidths[index] };
			const className = index === 0 ? "left-padding-15px" : "";
			headRow.push(<Th className={className} key={headRow.length} style={columnStyle}>
				{datasets[index].header}
			</Th>);
		}
		// Add an extra column for the scrollbar
		headRow.push(<Th key={headRow.length} style={{ "width": "7px" }} column={" "} />);

		const header = (<Thead key="datasets-table-thead">{headRow}</Thead>);
		return (
			<div className="datasets-table-container-header-wrapper">
				<div className="datasets-table-header-container" style={{ width: "100%" }}>
					<Table className="datasets-header-border"
						id="table-header"
						sortable={sortable}
					>
						{header}
					</Table>
				</div>
			</div>
		);
	}

	renderPanel() {
		const colWidths = [];
		const datasets = this.getDatasets();
		for (let ii = 0; ii < datasets.length; ii++) {
			colWidths.push({ width: 30 });
		}
		const parentTableWidth = parseInt(this.tableWidth, 10);
		const columnWidths = CustomDatasetsPanel.calculateColumnWidths(colWidths, "", parentTableWidth);
		const headerData = this.getColumnHeader(columnWidths);
		const rowData = this.getRowData(columnWidths);
		const tableStyle = "";
		return (
			<div key="main-div-2" className="left-right-padding-8">
				<span>Field Matches and Structure</span>
				<br />
				<div key="custom-datasets-div" id="datasets-table-container-wrapper">
					{headerData}
					<div className={"datasets-table-container-absolute"} style={{ tableStyle }}>
						<div id={"datasets-table-container"} style={{ width: "100%" }}>
							<Table
								className="table"
								id="datasets-table"
								hideTableHeader
							>
								{rowData}
							</Table>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

CustomDatasetsPanel.datasetsMain = null;
CustomDatasetsPanel.datasetsAll = null;

export default CustomDatasetsPanel;
