/**
 * javascript file for managing Budgetanträge
 * This controller calls functions from the js view for modifying the DOM,
 * and calls functions from the js ajax files to perform calls to the Codeigniter Budgetantraege controller
 */

var CALLED_PATH = FHC_JS_DATA_STORAGE_OBJECT.called_path;
//id prefixes
var NEW_BUDGET_PREFIX = "newb", NEW_POSITION_PREFIX = "newp", BUDGETANTRAG_PREFIX = "budget", POSITION_PREFIX = "position";
var GLOBAL_STATUSES = {"new" : {"bez": "new", "verb": "auf \"neu\" setzen", "adj": "auf \"neu\" gesetzt", "editable": true},
						"sent" : {"bez": "sent", "verb": "abschicken", "adj": "auf \"abgeschickt\" gesetzt", "editable": true},
						"rejected" : {"bez": "rejected", "verb": "ablehnen", "adj": "auf \"abgelehnt\" gesetzt", "editable": false},
						"approved" : {"bez": "approved", "verb": "freigeben", "adj": "auf \"freigegeben\" gesetzt", "editable": false}
						};

$(document).ready(function () {
	if (typeof(Storage) !== "undefined" && sessionStorage.getItem("budgetgeschaeftsjahr") !== null)
	{
		$("#geschaeftsjahr").val(sessionStorage.getItem("budgetgeschaeftsjahr"));
	}

	BudgetantraegeController.global_inputparams.geschaeftsjahr = $("#geschaeftsjahr").val();
	BudgetantraegeController.global_inputparams.kostenstelle = $("#kostenstelle").val();

	BudgetantraegeAjax.checkIfVerwaltbar(
		BudgetantraegeController.global_inputparams.geschaeftsjahr,
		BudgetantraegeController.global_inputparams.kostenstelle,
		function(data, textStatus, jqXHR)
		{
			if (FHC_AjaxClient.hasData(data))
			{
				//set edit mode if current Geschaeftsjahr or later is selected
				BudgetantraegeController.global_booleans.editmode = data.retval[0];
			}
			else
			{
				BudgetantraegeController.global_booleans.editmode = false;
			}
		}
	);

	//load projects
	BudgetantraegeAjax.getProjekte();

	if (BudgetantraegeController.globalGjandKstAreValid())
	{
		BudgetantraegeAjax.checkIfKstFreigebbar(BudgetantraegeController.global_inputparams.kostenstelle, BudgetantraegeController.afterKstFreigebbarGet);
	}

	//change view anytime a new Geschäftsjahr/Kostenstelle is entered
	$("#geschaeftsjahr").change(
		function ()
		{
			$("#gjgroup").removeClass("has-error");
			var geschaeftsjahr = $(this).val();
			var kostenstelle = $("#kostenstelle").val();
			BudgetantraegeController.global_inputparams.geschaeftsjahr = geschaeftsjahr;

			if (typeof(Storage) !== "undefined")
			{
				sessionStorage.setItem("budgetgeschaeftsjahr", geschaeftsjahr);
			}

			if (BudgetantraegeController.global_inputparams.geschaeftsjahr !== "null" && BudgetantraegeController.global_inputparams.geschaeftsjahr !== null)
			{
				BudgetantraegeAjax.checkIfVerwaltbar(
					BudgetantraegeController.global_inputparams.geschaeftsjahr,
					BudgetantraegeController.global_inputparams.kostenstelle,
					function (data, textStatus, jqXHR)
					{
						if (FHC_AjaxClient.hasData(data))
						{
							BudgetantraegeController.global_booleans.editmode = data.retval[0];
						}
						else
						{
							BudgetantraegeController.global_booleans.editmode = false;
						}

						BudgetantraegeAjax.getKostenstellen(BudgetantraegeController.global_inputparams.geschaeftsjahr,
							function (data, textStatus, jqXHR)
							{
								if (FHC_AjaxClient.isError(data))
									return;

								BudgetantraegeController.afterKostenstellenGet(data);

								if (!BudgetantraegeController.globalGjandKstAreValid())
								{
									BudgetantraegeController.clearBudgetantraege();
									return;
								}

								BudgetantraegeController.getBudgetantraege();
							}
						);
					}
				);
			}
		}
	);

	$("#kostenstelle").change(
		function ()
		{
			$("#kstgroup").removeClass("has-error");
			BudgetantraegeController.global_inputparams.kostenstelle =  $(this).val();

			if (!BudgetantraegeController.globalGjandKstAreValid())
			{
				BudgetantraegeController.clearBudgetantraege();
				return;
			}
			BudgetantraegeAjax.checkIfVerwaltbar(
				BudgetantraegeController.global_inputparams.geschaeftsjahr,
				BudgetantraegeController.global_inputparams.kostenstelle,
				function(data, textStatus, jqXHR)
				{
					if (FHC_AjaxClient.hasData(data))
					{
						BudgetantraegeController.global_booleans.editmode = data.retval[0];
					}
					else
					{
						BudgetantraegeController.global_booleans.editmode = false;
						return;
					}
					BudgetantraegeAjax.checkIfKstFreigebbar(BudgetantraegeController.global_inputparams.kostenstelle, BudgetantraegeController.afterKstFreigebbarGet);
				}
			);
		}
	);
});

var BudgetantraegeController = {
	// -----------------------------------------------------------------------------------------------------------------
	// Variables
	global_inputparams: {"geschaeftsjahr": null, "kostenstelle": null},
	global_preloads: {"kostenstellen": [], "projekte": [], "konten": []},
	//global objects for storing current state of Budgetanträge together with their positions: how many added, deleted, updated
	global_budgetantraege: {"newBudgetantraege": [], "existentBudgetantraege": []},
	global_counters: {"countNewAntraege": 0, "countNewPosition": 0, "lastAddedOldId": ""},//counters for giving unique id to every new position or budget, [POSITION_PREFIX]_[counter]
	global_booleans: {"editmode": false, "freigebbar": false},

	// -----------------------------------------------------------------------------------------------------------------
	// Initialisers (call ajax functions or view functions)

	/**
	 * Initializes getBudgetantraege (gets Konten first)
	 */
	getBudgetantraege: function()
	{
		BudgetantraegeAjax.getKonten(BudgetantraegeController.global_inputparams.kostenstelle, BudgetantraegeController.afterKontenGet);
	},

	/**
	 * Clears Budgetantraege by emptying global arrays and removing html
	 */
	clearBudgetantraege: function()
	{
		BudgetantraegeController.global_budgetantraege.existentBudgetantraege = [];
		BudgetantraegeController.global_budgetantraege.newBudgetantraege = [];
		BudgetantraegeView.removeBudgetantraege();
	},

	/**
	 * Adds new Budgetantrag,  id is already saved in global newBudgetantraegearray
	 * Initializes retrieving form data and Ajax call
	 * @param budgetantragid
	 */
	addNewBudgetantrag: function(budgetantragid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.newBudgetantraege, budgetantragid);

		if (budgetantrag === false)
			return;

		var positionen = BudgetantraegeView.retrieveBudgetantragPositionen(budgetantragid, false);

		if (positionen === null)
			return;

		var data = {
			"geschaeftsjahr_kurzbz": BudgetantraegeController.global_inputparams.geschaeftsjahr,
			"kostenstelle_id": BudgetantraegeController.global_inputparams.kostenstelle,
			"bezeichnung": budgetantrag.bezeichnung,
			"positionen": positionen
		};

		BudgetantraegeAjax.addBudgetantrag(data, budgetantragid);
	},

	/**
	 * Update Bezeichnung of Budgetantrag
	 * @param budgetantragid
	 * @param bezeichnung
	 */
	updateBudgetantragBezeichnung: function(budgetantragid, bezeichnung)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);

		if (budgetantrag === false)
		{
			var newbudgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.newBudgetantraege, budgetantragid);
			if (newbudgetantrag !== false)
			{
				newbudgetantrag.bezeichnung = bezeichnung;
				BudgetantraegeView.setBudgetantragBezeichnungEditConfirm(budgetantragid, bezeichnung);
			}
			return;
		}
		BudgetantraegeAjax.updateBudgetantragBezeichnung(budgetantragid, bezeichnung);
	},

	/**
	 * Updates Budgetpositionen for a given Budgetantrag. This includes adding, editing and deleting Budgetpositionen!
	 * Accesses global arrays for getting current state for the budgetantrag, creates and passes 3 arrays,
	 * each for adding, updating and deleting, to ajax update funcion.
	 * @param budgetantragid
	 */
	updateBudgetpositionen: function(budgetantragid)
	{
		var positionen = BudgetantraegeView.retrieveBudgetantragPositionen(budgetantragid, true);

		if (positionen === null)
			return;

		var positionenToAdd = [], positionenToUpdate = [], positionenToDelete = [];

		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);

		var idsToAdd = budgetantrag.positionentoadd;
		var idsToDelete = budgetantrag.positionentodelete;

		for (var i = 0; i < positionen.length; i++)
		{
			var position = positionen[i];
			var positionid = position.budgetposition_id;

			if (BudgetantraegeLib.findInArray(idsToAdd, positionid) !== false)
			{
				positionenToAdd.push(position.position);
				continue;
			}

			var initialPosition = BudgetantraegeLib.findInArray(budgetantrag.positionen, positionid);

			//updated if it is in existentBudgetantraege, has changed, and is not going to be deleted anyway
			if (initialPosition !== false && BudgetantraegeView.checkIfBudgetpositionFormChanged(initialPosition) && !BudgetantraegeLib.findInArray(idsToDelete, positionid))
			{
				positionenToUpdate.push(position);
			}
		}

		for (var j = 0; j < idsToDelete.length; j++)
			positionenToDelete.push({"budgetposition_id": idsToDelete[j].id});

		var data = {
			"positionentoadd": positionenToAdd,
			"positionentoupdate": positionenToUpdate,
			"positionentodelete": positionenToDelete
		};

		if (positionenToAdd.length > 0 || positionenToUpdate.length > 0 || positionenToDelete.length > 0)
		{
			BudgetantraegeAjax.updateBudgetpositionen(budgetantragid, data);
		}
		else
		{
			BudgetantraegeView.setMessage(budgetantragid, "text-success", "Budgetantrag ist unverändert")
		}
	},

	/**
	 * Initializes deletion of a Budgetantrag
	 * @param budgetantragid
	 */
	deleteBudgetantrag: function(budgetantragid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);
		// if Budgetantrag exists, delete, otherwise it is new Antrag - remove html only
		if (budgetantrag === false)
			BudgetantraegeView.removeBudgetantrag(budgetantragid);
		else
		{
			BudgetantraegeView.showDelBudgetantragModal(budgetantrag.bezeichnung);
			var delmodal = $("#delModalConfirm");
			delmodal.off("click");
			delmodal.click(
				function ()
				{
					BudgetantraegeAjax.deleteBudgetantrag(budgetantragid);
				}
			);
		}
	},

	/**
	 * Initializes change of a Budgetantrag status
	 * @param budgetantragid
	 * @param statuskurzbz
	 */
	updateBudgetantragStatus: function(budgetantragid, statuskurzbz)
	{
		BudgetantraegeView.showFrgBudgetantragModal(statuskurzbz);
		var frgmodal = $("#frgModalConfirm");
		frgmodal.off("click");
		frgmodal.click(
			function ()
			{
				BudgetantraegeAjax.updateBudgetantragStatus(budgetantragid, statuskurzbz);
			}
		);
	},

	// -----------------------------------------------------------------------------------------------------------------
	// Ajax callbacks (called after ajax execution)

	/**
	 * Executes after Ajax for getting all Budgetanträge is finished
	 * @param data
	 */
	afterKostenstellenGet: function(data)
	{
		if (FHC_AjaxClient.isError(data))
			return;

		var kostenstellen = data.retval;

		var kstgone = true;

		for (var i = 0; i < kostenstellen.length; i++)
		{
			if (BudgetantraegeController.global_inputparams.kostenstelle === kostenstellen[i].kostenstelle_id)
			{
				kstgone = false;
				break;
			}
		}

		//reset global kostenstelle to null if kostenstelle is not available anymore
		if (kstgone)
		{
			$("#kostenstelle").val("null");
			BudgetantraegeController.global_inputparams.kostenstelle = null;
		}

		BudgetantraegeView.appendKostenstellen(kostenstellen);
	},

	/**
	 * Executes after Ajax for getting all Projekte is finished
	 * @param data
	 */
	afterProjekteGet: function(data)
	{
		if (FHC_AjaxClient.isError(data))
			return;
		BudgetantraegeController.global_preloads.projekte = data.retval;
	},

	/**
	 * Executes after Ajax for getting all Konten is finished
	 * @param data
	 */
	afterKontenGet: function(data)
	{
		if (FHC_AjaxClient.isError(data))
			return;
		BudgetantraegeController.global_preloads.konten = data.retval;
		BudgetantraegeAjax.getBudgetantraege(BudgetantraegeController.global_inputparams.geschaeftsjahr, BudgetantraegeController.global_inputparams.kostenstelle);
	},

	/**
	 * Executes after Ajax for checking if Kostenstelle is freigebbar is finished
	 * @param data
	 */
	afterKstFreigebbarGet: function (data)
	{
		if (FHC_AjaxClient.hasData(data))
		{
			BudgetantraegeController.global_booleans.freigebbar = data.retval[0];
		}
		else
		{
			BudgetantraegeController.global_booleans.freigebbar = false;
		}
		BudgetantraegeController.getBudgetantraege();
	},

	/**
	 * Executes after Ajax for checking Budgetposition dependencies is finished
	 * @param data
	 * @param budgetantrag_id
	 * @param budgetposition_id
	 */
	afterBudgetpositionDependenciesGet: function (data, budgetantrag_id, budgetposition_id)
	{
		if (FHC_AjaxClient.isError(data))
		{
			FHC_DialogLib.alertError("Fehler bei Prüfung der Budgetantragsabhängigkeiten!");
			return;
		}

		if (FHC_AjaxClient.hasData(data))
		{
			var abhaengigkeiten = data.retval;
			for (var abhTyp in abhaengigkeiten)
			{
				FHC_DialogLib.alertError("Budgetposition kann nicht gelöscht werden, da es abhängige" + abhTyp + " gibt. (" + abhaengigkeiten[abhTyp].join(", ") + ")");
			}
		}
		else
		{
			var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantrag_id);
			budgetantrag.positionentodelete.push({"id": budgetposition_id});
			//remove from GUI
			BudgetantraegeView.removeBudgetposition(budgetposition_id);
			BudgetantraegeView.checkIfSaved(budgetantrag_id);
		}
	},

	/**
	 * Executes after Ajax for getting all Budgetanträge is finished
	 * @param data
	 */
	afterBudgetantraegeGet: function(data)
	{
		if (FHC_AjaxClient.isError(data))
			return;

		var budgetantraege = data.retval;

		BudgetantraegeController.clearBudgetantraege();

		for (var i = 0; i < budgetantraege.length; i++)
		{
			var budgetantrag = budgetantraege[i];
			BudgetantraegeController.addAntragToExistingAntraegeArray(budgetantrag);
		}
		BudgetantraegeView.appendBudgetantraege(budgetantraege);
		BudgetantraegeController.calculateBudgetantragSums();
	},

	/**
	 * Executes after Ajax for adding Budgetantrag is finished. Updates Budgetantrag after adding by calling Ajax.
	 * @param data
	 * @param oldid
	 */
	afterBudgetantragAdd: function(data, oldid)
	{
		if (FHC_AjaxClient.isError(data))
		{
			BudgetantraegeView.setMessage(oldid, "text-danger", "Fehler beim Speichern des Budgetantrags!");
			return;
		}
		//save old id for showing message
		BudgetantraegeController.global_counters.lastAddedOldId = oldid;
		//update Budgetantragid in the view to the id of newly added Antrag
		$("#"+BUDGETANTRAG_PREFIX+"_"+oldid).prop("id", BUDGETANTRAG_PREFIX+"_"+data.retval);
		BudgetantraegeAjax.getBudgetantrag(data.retval, "gespeichert");
	},

	/**
	 * Executes after Ajax for adding Budgetantrag is finished. Updates Budgetantrag after adding by calling Ajax.
	 * @param data
	 * @param budgetantragid
	 */
	afterBudgetantragUpdate: function(data, budgetantragid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);
		var hasError = false;
		var errorpositions = [];
		if (!FHC_AjaxClient.hasData(data) || data.retval.errors.length > 0)
		{
			hasError = true;
			for (var erridx in data.retval.errors)
			{
				var errorvalue = data.retval.errors[erridx];
				var budgetposition = BudgetantraegeLib.findInArray(budgetantrag.positionen, errorvalue);
				if (budgetposition.budgetposten)
					errorpositions.push(budgetposition.budgetposten);
				else
					errorpositions.push(errorvalue);
			}
		}

		//reset delete and add ids
		budgetantrag.positionentodelete = [];
		budgetantrag.positionentoadd = [];

		var message = "gespeichert";
		if (hasError)
			message = {"errors": errorpositions};

		BudgetantraegeAjax.getBudgetantrag(budgetantragid, message);
	},

	/**
	 * Executes after Ajax for getting a single Budgetantrag is finished, for refreshing html and array
	 * @param data
	 * @param oldbudgetantragid id before update for messaging (in case of error)
	 * @param message type of performed update (freigeben, speichern...) before the get
	 */
	afterBudgetantragGet: function(data, oldbudgetantragid, message)
	{
		if (!FHC_AjaxClient.hasData(data))
		{
			var msgid = $("#"+BUDGETANTRAG_PREFIX+"_"+BudgetantraegeController.global_counters.lastAddedOldId).length ? BudgetantraegeController.global_counters.lastAddedOldId : oldbudgetantragid;
			BudgetantraegeView.setMessage(msgid, "text-danger", "Fehler beim Speichern des Budgetantrags!");
			return;
		}
		var budgetantrag = data.retval[0];
		BudgetantraegeController.addAntragToExistingAntraegeArray(budgetantrag);
		BudgetantraegeView.refreshBudgetantrag(budgetantrag);
		BudgetantraegeController.calculateBudgetantragSums();
		if (typeof message === "string")
			BudgetantraegeView.setMessage(oldbudgetantragid, 'text-success', 'Budgetantrag erfolgreich '+message+'!');
		else if (message.errors)
		{
			BudgetantraegeView.setMessage(oldbudgetantragid, 'text-danger', 'Fehler beim Speichern des Budgetantrags! Betroffene Positionen: '+message.errors.join(', '));
		}
	},

	afterBudgetantragBezeichnungUpdate: function(data, bezeichnung)
	{
		if (!FHC_AjaxClient.hasData(data))
		{
			FHC_DialogLib.alertError("Fehler beim Speichern der Budgetantragsbezeichnung!");
			return;
		}
		var budgetantragid = data.retval;
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);
		budgetantrag.bezeichnung = bezeichnung;
		BudgetantraegeView.setBudgetantragBezeichnungEditConfirm(budgetantragid, bezeichnung);
	},

	/**
	 * Executes after Ajax for deleting a single Budgetantrag is finished, refreshes array and sums
	 * @param data
	 */
	afterBudgetantragDelete: function(data)
	{
		if (!FHC_AjaxClient.hasData(data))
		{
			if (typeof data.retval === 'string')
				FHC_DialogLib.alertError(data.retval);
			else
				FHC_DialogLib.alertError("Fehler beim Löschen des Budgetantrags!");

			return;
		}

		BudgetantraegeController.global_budgetantraege.existentBudgetantraege = BudgetantraegeController.global_budgetantraege.existentBudgetantraege.filter(
			function (el)
			{
				return el.id !== data.retval;
			}
		);

		BudgetantraegeController.calculateBudgetantragSums();
		BudgetantraegeView.removeBudgetantrag(data.retval);
	},

	/**
	 * Executes after Ajax for changing Budgetantrag Status is executed, initialises refreshing of changed Budgetantrag
	 * @param budgetantragid
	 * @param data
	 */
	afterBudgetantragStatusUpdate: function(budgetantragid, data)
	{
		$("#frgAntragModal").modal('hide');

		if (!FHC_AjaxClient.hasData(data))
		{
			BudgetantraegeView.setMessage(budgetantragid, "text-danger", "Fehler beim Ändern des Budgetstatus!");
			return;
		}
		var budgetantragstatus = data.retval[0];

		BudgetantraegeAjax.getBudgetantrag(budgetantragid, GLOBAL_STATUSES[budgetantragstatus.budgetstatus_kurzbz].adj);
	},

	// -----------------------------------------------------------------------------------------------------------------
	// Other Modifiers (handle global array update and/or call view functions for appending/modifying html)

	/**
	 * Appends new Budgetantrag to html
	 * @param budgetantragid
	 */
	appendNewBudgetantrag: function(budgetantragid)
	{
		var passed = BudgetantraegeView.checkBudgetantragDataBeforeAdd();

		if (passed === false)
			return;

		BudgetantraegeView.collapseAllBudgetantraege();

		BudgetantraegeController.global_budgetantraege.newBudgetantraege.push({"id": budgetantragid, "bezeichnung": passed, "positionen": []});
		BudgetantraegeController.global_counters.countNewAntraege++;

		BudgetantraegeView.appendBudgetantrag(budgetantragid, {"bezeichnung": passed}, 0, 0, true, true);
		BudgetantraegeView.setBudgetantragStatus(budgetantragid, { "bezeichnung": "Neu", "datum": ""});
		BudgetantraegeController.appendNewBudgetposition(budgetantragid);
		BudgetantraegeView.appendBudgetantragFooter(budgetantragid, {isNewAntrag: true, freigabeAufhebenBtn: false}, true);
	},

	/**
	 * Appends new Budgetposition to html of a Budgetantrag
	 * @param budgetantragid
	 */
	appendNewBudgetposition: function(budgetantragid)
	{
		var positionid = NEW_POSITION_PREFIX+BudgetantraegeController.global_counters.countNewPosition;
		var newbudgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.newBudgetantraege, budgetantragid);
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);

		if (newbudgetantrag !== false)
			newbudgetantrag.positionen.push({"id": positionid});
		else if (budgetantrag !== false)
			budgetantrag.positionentoadd.push({"id": positionid});

		BudgetantraegeController.global_counters.countNewPosition++;
		//BudgetantraegeView.collapseAllBudgetpositionen(budgetantragid);
		BudgetantraegeView.appendBudgetposition(budgetantragid, positionid, null, true, true);
		BudgetantraegeView.checkIfSaved(budgetantragid);
	},

	/**
	 * Initialises deletion of budgetposition to be removed from a Budgetantrag
	 * @param budgetantragid
	 * @param positionid
	 */
	deleteBudgetposition: function(budgetantragid, positionid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);

		//new budgetantrag - only delete from GUI
		if (budgetantrag === false)
		{
			BudgetantraegeView.removeBudgetposition(positionid);
		}
		else
		{
			var budgetposition = BudgetantraegeLib.findInArray(budgetantrag.positionen, positionid);

			//new Budgetposition is deleted - only delete from GUI
			if (budgetposition === false)
			{
				//remove from positionentoadd
				budgetantrag.positionentoadd = budgetantrag.positionentoadd.filter(
					function (el) {
						return el.id !== positionid;
					}
				);
				BudgetantraegeView.removeBudgetposition(positionid);
			}
			else //existing Budgetposition is deleted - initialise deletion check
				BudgetantraegeAjax.checkBudgetpositionDependencies(budgetantragid, positionid, BudgetantraegeController.afterBudgetpositionDependenciesGet);
		}
	},

	/**
	 * Adds Budgetantrag to existentBudgetantraege array if its a new Antrag,
	 * updates positions of the array if the Antrag already exists
	 * @param budgetantragToAdd
	 */
	addAntragToExistingAntraegeArray: function(budgetantragToAdd)
	{
		var newBudgetantragId = budgetantragToAdd.budgetantrag_id;
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, newBudgetantragId);

		var updatedPositionen = [];
		for (var i = 0; i < budgetantragToAdd.budgetpositionen.length; i++)
		{
			var position = budgetantragToAdd.budgetpositionen[i];
			var betrag = position.betrag === null ? 0 : parseFloat(position.betrag);
			updatedPositionen.push({"id": position.budgetposition_id, "budgetposten": position.budgetposten, "betrag": betrag, "erloese": position.erloese});
		}

		var budgetantragData = {
			"id": newBudgetantragId,
			"bezeichnung":budgetantragToAdd.bezeichnung,
			"positionen": updatedPositionen,
			"positionentoadd": [],
			"positionentodelete": []
		};

		if (budgetantrag === false)
		{
			BudgetantraegeController.global_budgetantraege.existentBudgetantraege.push(budgetantragData);
		}
		else
		{
			budgetantrag.positionen = budgetantragData.positionen;
		}
	},

	// -----------------------------------------------------------------------------------------------------------------
	// Helper functions

	/**
	 * Checks if global Geschäftsjahr and Kostenstelle are valid
	 * @returns {boolean}
	 */
	globalGjandKstAreValid: function()
	{
		return (BudgetantraegeController.global_inputparams.geschaeftsjahr !== null &&
				BudgetantraegeController.global_inputparams.geschaeftsjahr !== 'null' &&
				BudgetantraegeController.global_inputparams.kostenstelle !== null &&
				BudgetantraegeController.global_inputparams.kostenstelle !== 'null')
	},

	/**
	 * Saves the initial state of a form, i.e. user input when the form was loaded.
	 * Needed for later check if form has been modified by user.
	 * @param budgetantragid
	 * @param budgetpositionid
	 */
	saveInitialFormState: function(budgetantragid, budgetpositionid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);
		if (budgetantrag === false) return;

		var budgetposition = BudgetantraegeLib.findInArray(budgetantrag.positionen, budgetpositionid);
		if (budgetposition === false) return;

		budgetposition.initialForm = $("#form_" + budgetpositionid).serialize();
	},

	/**
	 * calculates sums (saved, freigegeben...)
	 */
	calculateBudgetantragSums: function()
	{
		var sums = {
			"savedsum": 0,
			"erloeseSavedSum": 0
		};
		for (var i = 0; i < BudgetantraegeController.global_budgetantraege.existentBudgetantraege.length; i++)
		{
			var budgetantrag = BudgetantraegeController.global_budgetantraege.existentBudgetantraege[i];
			for (var j = 0; j < budgetantrag.positionen.length; j++)
			{
				var betrag = budgetantrag.positionen[j].betrag;
				if (betrag !== null)
				{
					if (budgetantrag.positionen[j].erloese === true)
					{
						sums.erloeseSavedSum += budgetantrag.positionen[j].betrag;
					}
					else
					{
						sums.savedsum += budgetantrag.positionen[j].betrag;
					}
				}
			}
		}

		BudgetantraegeView.setTotalSums(sums);
	}
};
