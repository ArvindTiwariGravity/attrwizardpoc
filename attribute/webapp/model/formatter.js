sap.ui.define([], function () {
    "use strict";
  
    return {
  
      setNodeIcon: function (sType) {
        switch (sType) {
          case "Person":
            return "sap-icon://person-placeholder";
          case "Group":
            return "sap-icon://family-care";
            case "Property":
            return "sap-icon://home";
          default:
            return "sap-icon://account";
        }
      }
  
    };
  
  });