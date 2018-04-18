/*
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * javascript file for managing Budgetanträge
 * This controller calls functions from the js view for modifying the DOM,
 * and calls functions from the js ajax files to perform calls to the Budgetantraege controller
 */

//id prefixes
const NEW_BUDGET_PREFIX = "newb", NEW_POSITION_PREFIX = "newp", BUDGETANTRAG_PREFIX = "budget", POSITION_PREFIX = "position";
const FULL_URL = FHC_JS_DATA_STORAGE_OBJECT.app_root + FHC_JS_DATA_STORAGE_OBJECT.ci_router + "/"+FHC_JS_DATA_STORAGE_OBJECT.called_path;

var global_inputparams = {"geschaeftsjahr": null, "kostenstelle": null};
//global objects for storing current state of Budgetanträge together with their positions: how many added, deleted, updated
var global_preloads = {"kostenstellen": [], "projekte": [], "konten": []};
var global_budgetantraege = {"newBudgetantraege": [], "existentBudgetantraege": []};
var global_counters = {"countNewAntraege": 0, "countNewPosition": 0, "lastAddedOldId": "", "editmode": false};//counter for giving unique id to every new position, [POSITION_PREFIX]_[counter]
var global_booleans = {"editmode": false, "genehmigbar": false};
const GLOBAL_STATUSES = {"new" : {"bez": "new", "editable": true},
						"sent" : {"bez": "sent", "editable": true},
						"rejected" : {"bez": "rejected", "editable": false},
						"approved" : {"bez": "approved", "editable": false}
						};

$(document).ready(
	function ()
	{
		global_inputparams.geschaeftsjahr = $("#geschaeftsjahr").val();
		global_inputparams.kostenstelle = $("#kostenstelle").val();

		//set edit mode (normally true because next gj is default)
		$.when(
			checkIfCurrGeschaeftsjahrAjax(global_inputparams.geschaeftsjahr)
		).done(
			function (gjResponse)
			{
				if (gjResponse.error === 1)
					return;
				global_counters.editmode = gjResponse.retval;
			}
		);

		//load projects, then get all Budgetanträge
		$.when(
			getProjekteAjax()
		).done(
			function (projekteResponse)
			{
				if (projekteResponse.error === 1)
					return;
				global_preloads.projekte = projekteResponse.retval;
			}
		);

		$.when(
			getKostenstellenAjax(global_inputparams.geschaeftsjahr)
		).done(
			function(kstResponse)
			{
				afterKostenstellenGet(kstResponse)
			}
		);

		//change view anytime a new Geschäftsjahr/Kostenstelle is entered
		$("#geschaeftsjahr").change(
			function ()
			{
				$("#gjgroup").removeClass("has-error");
				var geschaeftsjahr = $(this).val();
				var kostenstelle = $("#kostenstelle").val();
				global_inputparams.geschaeftsjahr = geschaeftsjahr;

				if (global_inputparams.geschaeftsjahr !== "null" && global_inputparams.geschaeftsjahr !== null)
				{
					$.when(
						checkIfCurrGeschaeftsjahrAjax(global_inputparams.geschaeftsjahr), getKostenstellenAjax(global_inputparams.geschaeftsjahr)
					).done(
						function (gjResponse, kstResponse)
						{
							if (gjResponse[0].error === 1 || kstResponse[0].error === 1)
								return;

							afterKostenstellenGet(kstResponse[0]);

							if (!globalGjandKstAreValid())
							{
								clearBudgetantraege();
								return;
							}

							global_counters.editmode = gjResponse[0].retval;
							getBudgetantraege();
						}
					);
				}
			}
		);

		$("#kostenstelle").change(
			function ()
			{
				$("#kstgroup").removeClass("has-error");
				var kostenstelle = $(this).val();
				global_inputparams.kostenstelle = kostenstelle;

				if (!globalGjandKstAreValid())
				{
					clearBudgetantraege();
					return;
				}

				$.when(
					checkIfKstGenehmigbarAjax(global_inputparams.kostenstelle)
				).done(
					function (kstResponse)
					{
						global_booleans.genehmigbar = kstResponse;
						getBudgetantraege();
					}
				);

			}
		);
	}
);

// -----------------------------------------------------------------------------------------------------------------
// Initialisers (call ajax functions or view functions)

/**
 * Initializes getBudgetantraege
 */
function getBudgetantraege()
{
	$.when(
		getKontenAjax(global_inputparams.kostenstelle)
	).done(
		function (kontenResponse)
		{
			if (kontenResponse.error === 1)
				return;
			global_preloads.konten = kontenResponse.retval;
			getBudgetantraegeAjax(global_inputparams.geschaeftsjahr, global_inputparams.kostenstelle);
		}
	);
}

/**
 * Clears Budgetantraege by emptying global arrays and removing html
 */
function clearBudgetantraege()
{
	global_budgetantraege.existentBudgetantraege = [];
	global_budgetantraege.newBudgetantraege = [];
	removeBudgetantraege();
}

/**
 * Gets all Kostenstellen for Geschäftsjahr global
 */
function getKostenstellen()
{
	getKostenstellenAjax(global_inputparams.geschaeftsjahr)
}

/**
 * Adds new Budgetantrag which id is already saved in global newBudgetantraegearray
 * Initializes retrieving form data and Ajax call
 * @param budgetantragid
 */
function addNewBudgetantrag(budgetantragid)
{
	var budgetantrag = findInArray(global_budgetantraege.newBudgetantraege, budgetantragid);

	if (budgetantrag === false) return;

	var positionen = retrieveBudgetantragPositionen(budgetantragid, false);
	if (positionen === null) return;

	var data = {
		"geschaeftsjahr_kurzbz": global_inputparams.geschaeftsjahr,
		"kostenstelle_id": global_inputparams.kostenstelle,
		"bezeichnung": budgetantrag.bezeichnung,
		"positionen": positionen
	};

	addBudgetantragAjax(data, budgetantragid);
}

/**
 * Updates Budgetpositionen for a given Budgetantrag. this includes adding, editing and deleting Budgetpositionen!
 * Accesses global arrays for getting current state for the budgetantrag, creates and passes 3 arrays,
 * each for adding, updating and deleting, to ajax update funcion
 * @param budgetantragid
 */
function updateBudgetpositionen(budgetantragid)
{
	var positionen = retrieveBudgetantragPositionen(budgetantragid, true);

	if (positionen === null) return;

	var positionenToAdd = [], positionenToUpdate = [], positionenToDelete = [];

	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	var idsToAdd = budgetantrag.positionentoadd;
	var idsToDelete = budgetantrag.positionentodelete;

	for (var i = 0; i < positionen.length; i++)
	{
		var position = positionen[i];
		var positionid = position.budgetposition_id;

		if (findInArray(idsToAdd, positionid) !== false)
		{
			positionenToAdd.push(position.position);
			continue;
		}

		var initialPosition = findInArray(budgetantrag.positionen, positionid);

		//updated if it is in existentBudgetantraege, has changed, and is not going to be deleted anyway
		if (initialPosition !== false && checkIfBudgetpositionFormChanged(initialPosition) && !findInArray(idsToDelete, positionid))
			positionenToUpdate.push(position);
	}

	for (var i = 0; i < idsToDelete.length; i++)
		positionenToDelete.push({"budgetposition_id": idsToDelete[i].id});

	var data = {
		"positionentoadd": positionenToAdd,
		"positionentoupdate": positionenToUpdate,
		"positionentodelete": positionenToDelete
	};

	if (positionenToAdd.length > 0 || positionenToUpdate.length > 0 || positionenToDelete.length > 0)
	{
		updateBudgetpositionenAjax(budgetantragid, data);
	}
	else
	{
		setMessage(budgetantragid, "text-success", "Budgetantrag ist unverändert")
	}
}

/**
 * Initializes deletion of a Budgetantrag
 * @param budgetantragid
 */
function deleteBudgetantrag(budgetantragid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);
	if (budgetantrag === false)
		removeBudgetantrag(budgetantragid);
	else
	{
		showDelBudgetantragModal(budgetantrag.bezeichnung);
		var delmodal = $("#delModalConfirm");
		delmodal.off("click");
		delmodal.click(
			function ()
			{
				deleteBudgetantragAjax(budgetantragid);
			}
		);
	}
}

// -----------------------------------------------------------------------------------------------------------------
// Ajax callbacks (called after ajax execution)

/**
 * Executes after Ajax for getting all Budgetanträge is finished.
 * @param data
 */
function afterKostenstellenGet(data)
{
	if (data.error === 1) return;
	var kostenstellen = data.retval;

	//reset global kostenstelle to null if kostenstelle is not available anymore
	var kstgone = true;

	for (var i = 0; i < kostenstellen.length; i++)
	{
		if (global_inputparams.kostenstelle === kostenstellen[i].kostenstelle_id)
		{
			kstgone = false;
			break;
		}
	}

	if (kstgone)
	{
		$("#kostenstelle").val("null");
		global_inputparams.kostenstelle = null;
	}

	appendKostenstellen(kostenstellen);
}

/**
 * Executes after Ajax for getting all Budgetanträge is finished.
 * @param data
 */
function afterBudgetantraegeGet(data)
{
	if (data.error === 1) return;
	var budgetantraege = data.retval;

	clearBudgetantraege();

	for (var i = 0; i < budgetantraege.length; i++)
	{
		var budgetantrag = budgetantraege[i];
		addAntragToExistingAntraegeArray(budgetantrag);
	}
	appendBudgetantraege(budgetantraege);
	calculateBudgetantragSums();
}

/**
 * Executes after Ajax for adding Budgetantrag is finished. Updates Budgetantrag after adding by calling Ajax.
 * @param data
 * @param oldid
 */
function afterBudgetantragAdd(data, oldid)
{
	if (data.error === 1)
	{
		setMessage(oldid, "text-danger", "Fehler beim Speichern des Budgetantrags!");
		return;
	}
	//save old id for showing message
	global_counters.lastAddedOldId = oldid;
	//update Budgetantragid in the view to the id of newly added Antrag
	$("#"+BUDGETANTRAG_PREFIX+"_"+oldid).attr("id", BUDGETANTRAG_PREFIX+"_"+data.retval);
	getBudgetantragAjax(data.retval, "gespeichert");
}

/**
 * Executes after Ajax for adding Budgetantrag is finished. Updates Budgetantrag after adding by calling Ajax.
 * @param data
 * @param budgetantragid
 */
function afterBudgetantragUpdate(data, budgetantragid)
{
	if (data.error === 1)
	{
		setMessage(budgetantragid, "text-danger", "Fehler beim Speichern des Budgetantrags!");
		return;
	}
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	//reset delete and add ids
	budgetantrag.positionentodelete = [];
	budgetantrag.positionentoadd = [];

	getBudgetantragAjax(budgetantragid, "gespeichert");
}

/**
 * Executes after Ajax for getting a single Budgetantrag is finished, for refreshing html and array.
 * @param data
 * @param oldbudgetantragid id before update for messaging (in case of error)
 */
function afterBudgetantragGet(data, oldbudgetantragid, updatetype)
{
	if (data.error === 1)
	{
		var msgid = $("#"+BUDGETANTRAG_PREFIX+"_"+global_counters.lastAddedOldId).length ? global_counters.lastAddedOldId : oldbudgetantragid;
		setMessage(msgid, "text-danger", "Fehler beim Speichern des Budgetantrags!");
		return;
	}
	var budgetantrag = data.retval[0];
	addAntragToExistingAntraegeArray(budgetantrag);
	refreshBudgetantrag(budgetantrag);
	calculateBudgetantragSums();
	setMessage(oldbudgetantragid, 'text-success', 'Budgetantrag erfolgreich '+updatetype+'!');
}

/**
 * Executes after Ajax for deleting a single Budgetantrag is finished, refreshes array and sums
 * @param data
 */
function afterBudgetantragDelete(data)
{
	if(data.error === 1) return;

	global_budgetantraege.existentBudgetantraege = global_budgetantraege.existentBudgetantraege.filter(
		function (el)
		{
			return el.id !== data.retval;
		}
	);
	calculateBudgetantragSums();
	removeBudgetantrag(data.retval);
}

/**
 * Executes after Ajax for changing Budgetantrag Status is executed, initialises refreshing of changed Budgetantrag
 * @param budgetantragid
 * @param data
 */
function afterBudgetantragStatusChange(budgetantragid, data)
{
	if (data.error === 1)
	{
		setMessage(budgetantragid, "text-danger", "Fehler beim Ändern des Budgetstatus!");
		return;

	}
	var budgetantragstatus = data.retval[0];

	getBudgetantragAjax(budgetantragid, budgetantragstatus.bezeichnung.toLowerCase());
}

// -----------------------------------------------------------------------------------------------------------------
// Other Modifiers (handle global array update and/or call view functions for appending/modifying html)

/**
 * Appends new Budgetantrag to html
 * @param budgetantragid
 */
function appendNewBudgetantrag(budgetantragid)
{
	var passed = checkBudgetantragDataBeforeAdd();

	if (passed === false) return;

	collapseAllBudgetantraege();

	global_budgetantraege.newBudgetantraege.push({"id": budgetantragid, "bezeichnung": passed, "positionen": []});
	global_counters.countNewAntraege++;

	appendBudgetantrag(budgetantragid, {"bezeichnung": passed}, 0, true, true);
	setBudgetantragStatus(budgetantragid, { "bezeichnung": "Neu", "datum": ""});
	appendNewBudgetposition(budgetantragid);
	appendBudgetantragFooter(budgetantragid, true, true);
}

/**
 * Appends new Budgetposition to html of a Budgetantrag
 * @param budgetantragid
 */
function appendNewBudgetposition(budgetantragid)
{
	var positionid = NEW_POSITION_PREFIX+global_counters.countNewPosition;
	var newbudgetantrag = findInArray(global_budgetantraege.newBudgetantraege, budgetantragid);
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	if (newbudgetantrag !== false)
		newbudgetantrag.positionen.push({"id": positionid});
	else if (budgetantrag !== false)
		budgetantrag.positionentoadd.push({"id": positionid});

	global_counters.countNewPosition++;
	appendBudgetposition(budgetantragid, positionid, null, true, true);
	checkIfSaved(budgetantragid);
}

/**
 * Saves Position to be removed from a Budgetantrag
 * @param budgetantragid
 * @param positionid
 */
function deleteBudgetposition(budgetantragid, positionid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);
	if (budgetantrag === false) return;

	//remove from positionentoadd
	budgetantrag.positionentoadd = budgetantrag.positionentoadd.filter(
		function (el)
		{
			return el.id !== positionid;
		}
	);

	var budgetposition = findInArray(budgetantrag.positionen, positionid);
	if (budgetposition === false) return;

	budgetantrag.positionentodelete.push({"id": positionid});
}

/**
 * Adds Budgetantrag to existentBudgetantraege array if its a new Antrag,
 * updates positions of the array if the Antrag already exists
 * @param budgetantragToAdd
 */
function addAntragToExistingAntraegeArray(budgetantragToAdd)
{
	var newBudgetantragId = budgetantragToAdd.budgetantrag_id;
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, newBudgetantragId);

	var updatedPositionen = [];
	for (var i = 0; i < budgetantragToAdd.budgetpositionen.length; i++)
	{
		var position = budgetantragToAdd.budgetpositionen[i];
		var betrag = position.betrag === null ? 0 : parseFloat(position.betrag);
		updatedPositionen.push({"id": position.budgetposition_id, "betrag": betrag});
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
		global_budgetantraege.existentBudgetantraege.push(budgetantragData);
	}
	else
	{
		budgetantrag.positionen = budgetantragData.positionen;
	}
}

// -----------------------------------------------------------------------------------------------------------------
// Helper functions

/**
 * Checks if global Geschäftsjahr and Kostenstelle are valid
 * @returns {boolean}
 */
function globalGjandKstAreValid()
{
	return (global_inputparams.geschaeftsjahr !== null && global_inputparams.geschaeftsjahr !== 'null' && global_inputparams.kostenstelle !== null && global_inputparams.kostenstelle !== 'null')
}


/**
 * Saves the initial state of a form, i.e. user input when the form was loaded.
 * Needed for later check if form has been modified by user.
 * @param budgetantragid
 * @param budgetpositionid
 */
function saveInitialFormState(budgetantragid, budgetpositionid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);
	if (budgetantrag === false) return;

	var budgetposition = findInArray(budgetantrag.positionen, budgetpositionid);
	if (budgetposition === false) return;

	budgetposition.initialForm = $("#form_" + budgetpositionid).serialize();
}

/**
 * calculates sums (saved, freigegeben...)
 */
function calculateBudgetantragSums()
{
	var sums = {"savedsum": 0};
	for (var i = 0; i < global_budgetantraege.existentBudgetantraege.length; i++)
	{
		var budgetantrag = global_budgetantraege.existentBudgetantraege[i];
		for (var j = 0; j < budgetantrag.positionen.length; j++)
		{
			var betrag = budgetantrag.positionen[j].betrag;
			if (betrag !== null)
				sums.savedsum += budgetantrag.positionen[j].betrag;
		}
	}

	setTotalSums(sums);
}