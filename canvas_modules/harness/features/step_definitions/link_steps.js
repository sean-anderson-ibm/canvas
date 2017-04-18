/****************************************************************
** IBM Confidential
**
** OCO Source Materials
**
** SPSS Modeler
**
** (c) Copyright IBM Corp. 2017
**
** The source code for this program is not published or otherwise
** divested of its trade secrets, irrespective of what has been
** deposited with the U.S. Copyright Office.
*****************************************************************/
import { containLinkEvent, containLinkInObjectModel, getCommentIdFromObjectModel, getNodeIdFromObjectModel, getObjectModelCount } from "./utilities/validateUtil.js";
import { getHarnessData } from "./utilities/HTTPClient.js";
import { getURL } from "./utilities/test-config.js";
import { simulateDragDrop } from "./utilities/DragAndDrop.js";

/* global browser */

// ------------------------------------
//   Test Cases
// -------------------------------------
module.exports = function() {

	// Then I link node 1 the "Var. File" node to node 2 the "Derive" node for link 1 on the canvas
	// The canvasLinks arg should include the number of comment links in addition to data links.
	//
	this.Then(/^I link node (\d+) the "([^"]*)" node to node (\d+) the "([^"]*)" node for link (\d+) on the canvas$/,
  function(srcNodeIndex, srcNodeName, destNodeIndex, destNodeName, canvasLinks) {
	var orgNodeNumber = srcNodeIndex - 1;
	var destNodeNumber = destNodeIndex - 1;
	browser.execute(simulateDragDrop, ".node-circle", orgNodeNumber, ".node-inner-circle", destNodeNumber, 1, 1);

	// Start Validation
	browser.pause(1500);
	var linkCount = Number(canvasLinks);
	// verify link is in the canvas DOM
	var dataLinks = browser.$$(".canvas-data-link").length;
	var commentLinks = browser.$$(".canvas-comment-link").length;
	expect(dataLinks + commentLinks).toEqual(linkCount);

	// verify that the link is in the internal object model
	const testUrl = getURL();
	const getCanvasUrl = testUrl + "/v1/test-harness/canvas";
	const getEventLogUrl = testUrl + "/v1/test-harness/events";
	browser.timeoutsAsyncScript(5000);
	var objectModel = browser.executeAsync(getHarnessData, getCanvasUrl);
	var srcNodeId = browser.execute(getNodeIdFromObjectModel, objectModel.value, orgNodeNumber);
	var destNodeId = browser.execute(getNodeIdFromObjectModel, objectModel.value, destNodeNumber);
	var returnVal = browser.execute(containLinkInObjectModel, objectModel.value, srcNodeId.value, destNodeId.value);
	expect(returnVal.value).toBe(1);

	// verify that an event for a new link is in the external object model event log
	var eventLog = browser.executeAsync(getHarnessData, getEventLogUrl);
	returnVal = browser.execute(containLinkEvent, eventLog.value, srcNodeId.value, destNodeId.value,
															"editActionHandler() linkNodes");
	expect(returnVal.value).toBe(1);

});

	// Then I link comment 2 to node 6 the "Neural Net" node for link 7 on the canvas
	//
	this.Then(/^I link comment (\d+) to node (\d+) the "([^"]*)" node for link (\d+) on the canvas$/,
	function(commentNumber, nodeNumber, nodeName, canvasLinks) {
		var commentIndex = commentNumber - 1;
		var nodeIndex = nodeNumber - 1;
		browser.execute(simulateDragDrop, ".comment-box", commentIndex, ".node-inner-circle", nodeIndex, 1, 1);

		// Start Validation
		browser.pause(1000);
		var linkCount = Number(canvasLinks);
		// verify link is in the canvas DOM
		var dataLinks = browser.$$(".canvas-data-link").length;
		var commentLinks = browser.$$(".canvas-comment-link").length;
		expect(dataLinks + commentLinks).toEqual(linkCount);

		// verify that the link is in the internal object model
		const testUrl = getURL();
		const getCanvasUrl = testUrl + "/v1/test-harness/canvas";
		const getEventLogUrl = testUrl + "/v1/test-harness/events";
		browser.timeoutsAsyncScript(5000);
		var objectModel = browser.executeAsync(getHarnessData, getCanvasUrl);
		var srcNodeId = browser.execute(getCommentIdFromObjectModel, objectModel.value, commentIndex);
		var destNodeId = browser.execute(getNodeIdFromObjectModel, objectModel.value, nodeIndex);
		var returnVal = browser.execute(containLinkInObjectModel, objectModel.value, srcNodeId.value, destNodeId.value);
		expect(returnVal.value).toBe(1);

		// verify that an event for a new link is in the external object model event log
		var eventLog = browser.executeAsync(getHarnessData, getEventLogUrl);
		returnVal = browser.execute(containLinkEvent, eventLog.value, srcNodeId.value,
																destNodeId.value, "editActionHandler() linkComment");
		expect(returnVal.value).toBe(1);
	});

	// Then I delete link between comment 1 and node 1 the "Derive" node
	//
	this.Then(/^I delete comment link at (\d+), (\d+) between comment (\d+) and node (\d+) the "([^"]*)" node$/,
	function(linkX, linkY, sourceIndex, destinationIndex, destinationName) {
		var commentIndex = sourceIndex - 1;
		var nodeIndex = destinationIndex - 1;

		// delete the link
		browser.rightClick(".svg-canvas", Number(linkX), Number(linkY));
		browser.$(".context-menu-popover").$$(".react-context-menu-item")[0].$(".react-context-menu-link").click();

		// verify that the link is Not in the internal object model
		const testUrl = getURL();
		const getCanvasUrl = testUrl + "/v1/test-harness/canvas";
		browser.pause(500);
		browser.timeoutsAsyncScript(5000);
		var objectModel = browser.executeAsync(getHarnessData, getCanvasUrl);
		var srcNodeId = browser.execute(getCommentIdFromObjectModel, objectModel.value, commentIndex);
		var destNodeId = browser.execute(getNodeIdFromObjectModel, objectModel.value, nodeIndex);
		var returnVal = browser.execute(containLinkInObjectModel, objectModel.value, srcNodeId.value, destNodeId.value);
		expect(returnVal.value).toBe(0);
	});

	// Then I delete link between node 1 the "Filter" node and node 2 the "Type" node
	//
	this.Then(/^I delete node link at (\d+), (\d+) between node (\d+) the "([^"]*)" node and node (\d+) the "([^"]*)" node$/,
	function(linkX, linkY, sourceIndex, sourceName, destinationIndex, destinationName) {
		var srcNodeIndex = sourceIndex - 1;
		var destNodeIndex = destinationIndex - 1;

		// delete the link
		browser.rightClick(".svg-canvas", Number(linkX), Number(linkY));
		browser.$(".context-menu-popover").$$(".react-context-menu-item")[0].$(".react-context-menu-link").click();

		// verify that the link is Not in the internal object model
		const testUrl = getURL();
		const getCanvasUrl = testUrl + "/v1/test-harness/canvas";
		browser.pause(500);
		browser.timeoutsAsyncScript(5000);
		var objectModel = browser.executeAsync(getHarnessData, getCanvasUrl);
		var srcNodeId = browser.execute(getCommentIdFromObjectModel, objectModel.value, srcNodeIndex);
		var destNodeId = browser.execute(getNodeIdFromObjectModel, objectModel.value, destNodeIndex);
		var returnVal = browser.execute(containLinkInObjectModel, objectModel.value, srcNodeId.value, destNodeId.value);
		expect(returnVal.value).toBe(0);
	});

	// Then I validate there are 6 links on the canvas
	//
	this.Then(/^I validate there are (\d+) links on the canvas$/, function(canvasLinks) {
		browser.pause(500);
		var linkCount = Number(canvasLinks);
		// verify link is in the canvas DOM
		var dataLinks = browser.$$(".canvas-data-link").length;
		var commentLinks = browser.$$(".canvas-comment-link").length;
		expect(dataLinks + commentLinks).toEqual(linkCount);

		// verify that the link is in the internal object model
		const testUrl = getURL();
		const getCanvasUrl = testUrl + "/v1/test-harness/canvas";
		browser.timeoutsAsyncScript(5000);
		var objectModel = browser.executeAsync(getHarnessData, getCanvasUrl);
		var returnVal = browser.execute(getObjectModelCount, objectModel.value, "links", linkCount);
		expect(returnVal.value).toBe(linkCount);

	});
};
