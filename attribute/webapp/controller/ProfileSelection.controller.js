sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, JSONModel, MessageBox, Fragment, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("com.sap.attribute.controller.ProfileSelection", {
            onInit: function () {
                var oView = this.getView();
                this._oView = this.getView();
                this._oNavContainer = oView.byId("navContainer");
                this._oPage = oView.byId("idPage");
                this._selectProfile = oView.byId("idProfileComboBox");
                // var sDataPath = sap.ui.require.toUrl("/AttributeProfile");
                // //var sDataPath = "../AttributeProfile";
                // var oDataModel = new JSONModel(sDataPath);
                // oView.setModel(oDataModel);


            },
            onBeforeRendering: function () {
                this.oResourceModel = this.getOwnerComponent().getModel("i18n");
                var oView = this.getView();
                this.viewModel = oView.getModel('viewModel');
                this.viewModel.setProperty("/profiles", []);
                var that = this;

                $.get({
                    url: "/config/AttributeProfile",
                    success: function (oData) {
                        that.viewModel.setProperty("/profiles", oData.value);
                        that.viewModel.refresh();
                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                });

            },
            onProfileSelection: function (oEvent) {
                var oView = this.getView();
                var oSelectedProfile = this._selectProfile.getSelectedKey();
                var oViewModel = oView.getModel('viewModel');
                oViewModel.setProperty("/selectedProfileKey", oSelectedProfile);
                if (oSelectedProfile) {
                    oView.byId("btnCreateWizard").setEnabled(true);
                }
            },
            // onCreateWizardPress: async function (oEvent) {
            onCreateWizardPress: async function (oEvent) {

                var oView = this.getView();
                var oPage = oView.byId("idPage");
                //var oSelectedProfile = this._selectProfile.getSelectedKey();
                var oSelectedProfile = oView.getModel('viewModel').getProperty("/selectedProfileKey");
                //    var oFilter = new sap.ui.model.Filter('code', 'EQ', oSelectedProfile);
                // var sStaticLocation = "com/sap/attribute/model/";
                // var sDataFileName = "data.json";
                // if (oSelectedProfile) {
                //     sDataFileName = oSelectedProfile + ".json";
                // }
                // var sDataFilePath = sap.ui.require.toUrl(sStaticLocation + sDataFileName);
                this.oProfileDataModel = new JSONModel();
                var that = this;
                // await oProfileDataModel.loadData(sDataFilePath);
                $.get({
                    url: "/config/AttributeProfile?$filter=code eq " + "'" + oSelectedProfile + "'&$expand=to_block,to_type($expand=to_type($expand=to_attributeLookups))",
                    async: true,
                    success: function (oData) {

                        that.oProfileDataModel.setData(oData.value);
                        that.preparWizardSteps(that.oProfileDataModel, that._oWizard);
                        // that.viewModel.setProperty("/profiles", oData.value);
                        // that.viewModel.refresh();
                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                });

                if (!this._oWizard) {
                    this._oWizard = new sap.m.Wizard
                        ("idAttributeWizard",
                            {
                                showNextButton: true,
                                visible: false,
                                renderMode: "Page",
                                complete: this.wizardReviewHandler
                            });
                    oPage.addContent(this._oWizard);
                } else {
                    this._oWizard.setVisible(false);
                    this._oWizard.getSteps().forEach(element => {
                        element.removeAllContent();
                    });
                    this._oWizard.removeAllSteps();
                }


                //this.preparWizardSteps(this.oProfileDataModel, this._oWizard);


            },
            preparWizardSteps: function (oProfileDataModel, oWizard) {
                var arrSteps = [];
                var oProfileData = oProfileDataModel.getData();
                // var arrBlocks = oProfileData.value[0].to_block;
                var arrBlocks = oProfileData[0].to_block;
                if (arrBlocks.length > 0) {
                    for (var i = 0; i < arrBlocks.length; i++) {
                        arrSteps[arrBlocks[i].order] = arrBlocks[i];
                    }
                }
                for (var j = 1; j < arrSteps.length; j++) {
                    var oStep = new sap.m.WizardStep(
                        // arrSteps[j].profile_profile + arrSteps[j].block,
                        arrSteps[j].to_profile_code + arrSteps[j].code,
                        {
                            title: arrSteps[j].description,
                            visible: true,
                            validated: true
                            //activate: this.checkMadatoryAndActivateStep(oWizard)
                        }
                    );

                    this.createAndAddStepContent(oStep, oProfileData, arrSteps[j].code, oWizard);
                }

                oWizard.setVisible(true);
            },
            checkMadatoryAndActivateStep: function (oWizard) {

                oWizard.validateStep();
            },

            createAndAddStepContent: function (oStep, oProfileData, oBlock, oWizard) {

                var arrTypes = oProfileData[0].to_type;
                for (var i = 0; i < arrTypes.length; i++) {
                    //var typeData = arrTypes[i].type;
                    var typeData = arrTypes[i].to_type;

                    var bMandatory = arrTypes[i].mandatory;
                    //  if (oBlock === arrTypes[i].block_block) {
                    if (oBlock === arrTypes[i].to_block_code) {
                        var oForm = new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            layout: "ColumnLayout"
                        });
                        if (typeData.dataType_code == "string") {
                            // var oHBox= new sap.m.HBox({                                
                            // });
                            var oLabel = new sap.m.Label({
                                text: typeData.description,
                                labelFor: "idInput" + typeData.code,
                                required: bMandatory
                            });
                            //  oStep.addContent(oLabel);
                            var oInput = new sap.m.Input("idInput" + typeData.code, {
                                placeholder: typeData.description
                            });
                            oForm.addContent(oLabel);
                            oForm.addContent(oInput);
                            // oStep.addContent(oHBox);
                        }
                        if (typeData.dataType_code == "date") {
                            var oLabel = new sap.m.Label({
                                text: typeData.description,
                                labelFor: "idDatePicker" + typeData.code,
                                required: bMandatory
                            });
                            // oStep.addContent(oLabel);
                            var oDatePicker = new sap.m.DatePicker("idDatePicker" + typeData.code, {
                                placeholder: typeData.description
                            });
                            //  oStep.addContent(oDatePicker);
                            oForm.addContent(oLabel);
                            oForm.addContent(oDatePicker);
                        }

                        if (typeData.dataType_code == "lookup") {
                            var oLabel = new sap.m.Label({
                                text: typeData.description,
                                labelFor: "idValueHelp" + typeData.code,
                                required: bMandatory
                            });
                            if (typeData.to_attributeLookups.length < 10) {
                                var oInputValueHelp = new sap.m.ComboBox("idValueHelp" + typeData.code, {
                                    loadItems: this.onLoadItems
                                });
                            } else {
                                var oInputValueHelp = new sap.m.Input("idValueHelp" + typeData.code, {
                                    showSuggestion: true,
                                    suggest: this.onSuggest,
                                    startSuggestion: 1,
                                    showValueHelp: true,
                                    valueHelpRequest: this.onValueHelpRequest,
                                    placeholder: typeData.description

                                });
                            }

                            oForm.addContent(oLabel);
                            oForm.addContent(oInputValueHelp);
                        }
                        if (typeData.dataType_code == "decimal") {
                            var oLabel = new sap.m.Label({
                                text: typeData.description,
                                labelFor: "idNumberInput" + typeData.code,
                                required: bMandatory
                            });
                            // oStep.addContent(oLabel);
                            var oInputNumber = new sap.m.Input("idNumberInput" + typeData.code, {
                                type: "Number",
                                placeholder: typeData.description
                            });
                            // oStep.addContent(oInputNumber);
                            oForm.addContent(oLabel);
                            oForm.addContent(oInputNumber);
                        }
                        if (typeData.dataType_code == "checkbox") {

                            var oLabel = new sap.m.Label({
                                text: typeData.description,
                                labelFor: "idCheckbox" + typeData.code,
                                required: bMandatory
                            });
                            var oCheckbox = new sap.m.CheckBox("idCheckbox" + typeData.code, {
                                editable: true,
                                enabled: true,
                            });
                            // oStep.addContent(oCheckbox);
                            oForm.addContent(oLabel);
                            oForm.addContent(oCheckbox);
                        }
                        oStep.addContent(oForm);
                    }
                }
                oWizard.addStep(oStep);
            },
            wizardReviewHandler: function (oEvent) {
                var oWizard = oEvent.getSource();
                var oNavContainer = oEvent.getSource().getParent().getParent();
                var oReviewPage = oEvent.getSource().getParent().getParent().getPages()[1];
                oReviewPage.removeAllContent();
                var oPage = oEvent.getSource().getParent().getParent().getPages()[0];
                oNavContainer.to(oReviewPage);

                oWizard.getSteps().forEach(element => {
                    var oForm = new sap.ui.layout.form.SimpleForm(element.sId + "-Review" + Date.now(), {
                        //var oForm = new sap.ui.layout.form.SimpleForm({
                        title: element.getProperty("title"),
                        editable: false,
                        layout: "ResponsiveGridLayout"
                    });
                    oReviewPage.addContent(oForm);
                    element.getContent().forEach(stepElement => {
                        stepElement.getContent().forEach(stepElementContent => {
                            if (stepElementContent.getAssociation("labelFor")) {
                                var oLabel = new sap.m.Label({
                                    text: stepElementContent.getProperty("text")
                                });

                                oForm.addContent(oLabel);

                            } else {
                                var oControl;
                                var strID = stepElementContent.sId;
                                if (strID.includes("Checkbox")) {
                                    oControl = new sap.m.CheckBox({
                                        selected: stepElementContent.getProperty("selected"),
                                        enabled: false
                                    });

                                }
                                if (strID.includes("Input") || strID.includes("DatePicker") || strID.includes("ValueHelp")) {
                                    oControl = new sap.m.Text({
                                        text: stepElementContent.getProperty("value")
                                    });

                                }

                                oForm.addContent(oControl);
                            }
                        });

                    });
                    var oEditLink = new sap.m.Link({
                        text: "Edit"
                    }).attachPress(function (oEvent) {
                        var oFormId = oEvent.getSource().getParent().sId;
                        var oStepId = oFormId.substr(0, oFormId.indexOf("-"));

                        var oStep;
                        oWizard.getSteps().forEach(formElement => {
                            if (formElement.sId === oStepId) {
                                oStep = formElement;
                            }
                            var fnAfterNavigate = function () {
                                oWizard.goToStep(oStep);
                                oNavContainer.detachAfterNavigate(fnAfterNavigate);
                            }.bind(this);
                            oNavContainer.attachAfterNavigate(fnAfterNavigate);
                            oNavContainer.to(oPage);
                        });


                    });
                    oForm.addContent(oEditLink);

                });

            },
            handleWizardCancel: function () {
                this._handleMessageBoxOpen("Are you sure you want to cancel your Attribute wizard progress?", "warning");
            },
            handleWizardSubmit: function () {
                var oSubmitDataArray = [];
                this._oWizard.getSteps().forEach(element => {

                    element.getContent().forEach(stepElement => {
                        stepElement.getContent().forEach(stepElementContent => {

                            if (!stepElementContent.getAssociation("labelFor")) {
                                var strID = stepElementContent.sId;
                                if (strID.includes("Checkbox")) {

                                    var checkBoxValue = stepElementContent.getProperty("selected");
                                    oSubmitDataArray.push({ "key": strID, "value": checkBoxValue });

                                }
                                if (strID.includes("Input") || strID.includes("DatePicker") || strID.includes("ValueHelp")) {

                                    var inputBoxValue = stepElementContent.getProperty("value");
                                    oSubmitDataArray.push({ "key": strID, "value": inputBoxValue });
                                }
                            }

                        });

                    });


                });
                this._handleMessageBoxOpen(JSON.stringify(oSubmitDataArray) + "\n\n\n Are you sure you want to submit this data?", "confirm");
            },
            _handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
                MessageBox[sMessageBoxType](sMessage, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            this._oWizard.discardProgress(this._oWizard.getSteps()[0]);
                            this.handleNavBackToStep(this._oWizard.getSteps()[0]);
                        }
                    }.bind(this)
                });
            },
            handleNavBackToStep: function (step) {
                var fnAfterNavigate = function () {
                    this._oWizard.goToStep(step);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);
                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this._oNavContainer.to(this._oPage);
            },
            onValueHelpRequest: function (oEvent) {
                var oInputField = oEvent.getSource();
                var sInputValue = oEvent.getSource().getValue();

                var oView = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent();
                var oSelectedProfile = oView.getModel('viewModel').getProperty("/selectedProfileKey");
                var oTypeDataCodeForLookup = oEvent.getSource().sId.slice(11);

                var oValueHelpModel = oView.getModel('valueHelpModel');
                oValueHelpModel.setProperty("/valueHelpItems", []);
                var that = this;
                $.get({
                    url: "/config/AttributeProfile?$filter=code eq " + "'" + oSelectedProfile + "'&$expand=to_block,to_type($expand=to_type($expand=to_attributeLookups($filter=to_type_code eq " + "'" + oTypeDataCodeForLookup + "')))",
                    async: true,
                    success: function (oData) {
                        oData.value[0].to_type.forEach(element => {
                            if (element.to_type_code === oTypeDataCodeForLookup) {
                                oValueHelpModel.setProperty("/valueHelpItems", element.to_type.to_attributeLookups);

                            }
                        });

                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                });
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.sap.attribute.view.fragment.ValueHelpDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oDialog) {
                    oDialog.getBinding("items").filter([new Filter("description", FilterOperator.Contains, sInputValue)]);
                    oDialog.setTitle(oEvent.getSource().mProperties.placeholder);
                    oDialog.open(sInputValue);
                    oDialog.attachConfirm(function (oEvent) {
                        //     var oSelectedItem = oEvent.getParameter("selectedItem");
                        //    // oDialog.getItems().filter([]);

                        //     if (!oSelectedItem) {
                        //         return;
                        //     }

                        //     oEvent.getSource().setValue(oSelectedItem.getTitle() + "-" + oSelectedItem.getDescription());  
                        var aContexts = oEvent.getParameter("selectedContexts");
                        if (aContexts && aContexts.length) {
                            oInputField.setValue(
                                aContexts.map(function (oContext) {
                                    return oContext.getObject().value + "-" + oContext.getObject().description;
                                })
                            );
                        }
                    });
                });


            },
            onSuggest: function (oEvent) {
                var oView = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent();
                var oSelectedProfile = oView.getModel('viewModel').getProperty("/selectedProfileKey");
                var oTypeDataCodeForLookup = oEvent.getSource().sId.slice(11);
                var oInput = oEvent.getSource();
                var oValueHelpModel = oView.getModel('valueHelpModel');
                oValueHelpModel.setProperty("/valueHelpItems", []);
                oView.setModel(oValueHelpModel);

                $.get({
                    url: "/config/AttributeProfile?$filter=code eq " + "'" + oSelectedProfile + "'&$expand=to_block,to_type($expand=to_type($expand=to_attributeLookups($filter=to_type_code eq " + "'" + oTypeDataCodeForLookup + "')))",
                    async: true,
                    success: function (oData) {
                        oData.value[0].to_type.forEach(element => {
                            if (element.to_type_code === oTypeDataCodeForLookup) {
                                oValueHelpModel.setProperty("/valueHelpItems", element.to_type.to_attributeLookups);
                                if (!oInput.getSuggestionItems().length) {
                                    oInput.bindAggregation("suggestionItems", {
                                        path: "/valueHelpItems",
                                        template: new sap.ui.core.Item({
                                            key: "{value}",
                                            text: "{description}"
                                        })
                                    });
                                }

                            }

                        });

                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                });

            },
            onLoadItems: function (oEvent) {
                var oView = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getParent();
                var oSelectedProfile = oView.getModel('viewModel').getProperty("/selectedProfileKey");
                var oTypeDataCodeForLookup = oEvent.getSource().sId.slice(11);
                var oInput = oEvent.getSource();
                var oValueHelpModel = oView.getModel('valueHelpModel');
                oValueHelpModel.setProperty("/valueHelpItems", []);
                oView.setModel(oValueHelpModel);

                $.get({
                    url: "/config/AttributeProfile?$filter=code eq " + "'" + oSelectedProfile + "'&$expand=to_block,to_type($expand=to_type($expand=to_attributeLookups($filter=to_type_code eq " + "'" + oTypeDataCodeForLookup + "')))",
                    async: true,
                    success: function (oData) {
                        oData.value[0].to_type.forEach(element => {
                            if (element.to_type_code === oTypeDataCodeForLookup) {
                                oValueHelpModel.setProperty("/valueHelpItems", element.to_type.to_attributeLookups);
                                if (!oInput.getItems().length) {
                                    oInput.bindAggregation("items", {
                                        path: "/valueHelpItems",
                                        template: new sap.ui.core.Item({
                                            key: "{value}",
                                            text: "{description}"
                                        })
                                    });
                                }

                            }

                        });

                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                });

            },
            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                oEvent.getSource().setValue(oSelectedItem.getTitle());
            }
        });
    });
