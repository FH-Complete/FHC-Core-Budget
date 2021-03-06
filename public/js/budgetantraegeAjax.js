/**
 * javascript file for Ajax calls to controller of Budgetantraege
 */

var BudgetantraegeAjax = {

	getProjekte: function()
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getProjekte",
			null,
			{
				successCallback: function(data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterProjekteGet(data);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when retrieving Projekte!");
				}
			}
		);
	},

	getKonten: function(kostenstelle, successCallback)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getKonten/"+encodeURIComponent(kostenstelle),
			null,
			{
				successCallback: successCallback,
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when retrieving Konten!");
				}
			}
		);
	},

	checkIfVerwaltbar: function(geschaeftsjahr, kostenstelle, successCallback)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/checkIfVerwaltbar",
			{
				"geschaeftsjahr": geschaeftsjahr,
				"kostenstelle": kostenstelle
			},
			{
				successCallback: successCallback,
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when checking if verwaltbar!");
				}
			}
		);
	},

	checkIfKstFreigebbar: function(kostenstelle, successCallback)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/checkIfKostenstelleFreigebbar",
			{
				"kostenstelle_id": kostenstelle
			},
			{
				successCallback: successCallback,
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when checking Kst freigebbar!");
				}
			}
		);
	},

	checkBudgetpositionDependencies: function(budgetantrag_id, budgetposition_id)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/checkBudgetpositionDependencies",
			{
				"budgetposition_id": budgetposition_id
			},
			{
				successCallback: function(data)
				{
					BudgetantraegeController.afterBudgetpositionDependenciesGet(data, budgetantrag_id, budgetposition_id);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when checking budgetposition removal!");
				}
			}
		);
	},

	getKostenstellen: function(geschaeftsjahr, successCallback)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getKostenstellen",
			{
				"geschaeftsjahr": geschaeftsjahr
			},
			{
				successCallback: successCallback,
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when retrieving Kostenstellen!");
				}
			}
		);
	},

	getBudgetantraege: function(geschaeftsjahr, kostenstelle)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getBudgetantraege",
			{
				"geschaeftsjahr": geschaeftsjahr,
				"kostenstelle_id": kostenstelle
			},
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantraegeGet(data);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when retrieving Budgetantraege!");
				}
			}
		);
	},

	/**
	 * Ajax call for retrieving a single Budgetantrag. After execution, updates of view are triggered.
	 * Called each time a Budgetantrag is updated
	 * @param budgetantragid
	 * @param message type of Budgetantrag update (e.g. save, status change...) or array with budgetpositions with error
	 */
	getBudgetantrag: function(budgetantragid, message)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getBudgetantrag/"+encodeURIComponent(budgetantragid),
			null,
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragGet(data, budgetantragid, message);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when retrieving Budgetantraege!");
				}
			}
		);
	},

	addBudgetantrag: function(data, oldid)
	{
		FHC_AjaxClient.ajaxCallPost(
			CALLED_PATH + "/newBudgetantrag",
			data,
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragAdd(data, oldid);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when adding Budgetantrag!");
				}
			}
		);
	},

	updateBudgetantragBezeichnung: function(budgetantragid, bezeichnung)
	{
		FHC_AjaxClient.ajaxCallPost(
			CALLED_PATH + "/updateBudgetantragBezeichnung/"+encodeURIComponent(budgetantragid),
			{
				"budgetbezeichnung": bezeichnung
			},
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragBezeichnungUpdate(data, bezeichnung);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when updating Budgetantragsbezeichnung!");
				},
				veilTimeout: 0
			}
		);
	},

	updateBudgetpositionen: function(budgetantragid, data)
	{
		FHC_AjaxClient.ajaxCallPost(
			CALLED_PATH + "/updateBudgetantragPositionen/"+encodeURIComponent(budgetantragid),
			data,
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragUpdate(data, budgetantragid);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when updating Budgetpositionen!");
				}
			}
		);
	},

	deleteBudgetantrag: function(budgetantragid)
	{
		FHC_AjaxClient.ajaxCallPost(
			CALLED_PATH + "/deleteBudgetantrag/"+encodeURIComponent(budgetantragid),
			null,
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragDelete(data);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when deleting Budgetantrag!");
				},
				veilTimeout: 0
			}
		);

	},

	updateBudgetantragStatus: function(budgetantragid, statuskurzbz)
	{
		FHC_AjaxClient.ajaxCallPost(
			CALLED_PATH + "/updateBudgetantragStatus/" + encodeURIComponent(budgetantragid),
			{
				"budgetstatus_kurzbz": statuskurzbz
			},
			{
				successCallback: function (data, textStatus, jqXHR)
				{
					BudgetantraegeController.afterBudgetantragStatusUpdate(budgetantragid, data);
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					FHC_DialogLib.alertError("error when updating Budgetantragstatus!");
				},
				veilTimeout: 0
			}
		);
	}
};
