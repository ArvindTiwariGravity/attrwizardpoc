/*global QUnit*/

sap.ui.define([
	"comsap/attribute/controller/ProfileSelection.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ProfileSelection Controller");

	QUnit.test("I should test the ProfileSelection controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
